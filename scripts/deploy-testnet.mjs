import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  atomicWrite,
  cleanCliEnv,
  frontendEnv,
  HORIZON,
  networkArgs,
  requireCliVersion,
  sha256,
  TARGET_BALANCE,
  TESTNET_PASSPHRASE,
  TESTNET_RPC,
  topUpAmount,
  atomsFromBalance,
  validateState,
  oracleCommands,
  decodeInstanceEntries,
  instanceWasmHash,
  assertMintReconciled,
} from "./deployment-utils.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = join(root, ".testnet-deployment");
const stateFile = join(directory, "deployment.json");
const cliDirectory = join(directory, "cli");
const lockFile = join(directory, "running.lock");
const logFile = join(directory, "transactions.log");
const cliBinary = process.env.STEPTION_STELLAR_BIN || "stellar";
let child;
let logging = false;

const help = `Usage: ./deploy-testnet.sh [--check | --dry-run | --deploy | --fund-wallet G... | --print-oracle-commands EXPIRY]

  --check          Check tools and Testnet RPC; no keys or transactions (default)
  --dry-run        Print the deployment plan; no network, files or tool changes
  --deploy         Build/test, deploy or resume, then configure .env.local
  --fund-wallet G  Top up a Freighter public address to 1,000 test USDC
  --print-oracle-commands EXPIRY  Print mock settlement commands; do not execute
  --help           Show this help

Requires Node 22.12+, Rust 1.91.0 + wasm32v1-none, Stellar CLI 28.0.0+.
Run npm ci once before --check or --deploy. Deployment uses only fixed Stellar
Testnet endpoints. It creates isolated CLI identities backed by macOS Keychain,
custom test USDC (NOT Circle USDC), a mock oracle and the options contract.
State/logs/config backups: .testnet-deployment/ (ignored by Git).
No website hosting, mainnet operation, option purchase or automatic settlement.
`;

function run(program, args, { capture = false, secretOutput = false } = {}) {
  return new Promise((resolve, reject) => {
    const output = [];
    const label = `${program === cliBinary ? "stellar" : program} ${args.join(" ")}`;
    if (logging)
      appendFileSync(logFile, `\n[${new Date().toISOString()}] ${label}\n`);
    child = spawn(program, args, {
      cwd: root,
      env: program === cliBinary ? cleanCliEnv() : process.env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    child.stdout.on("data", (data) => {
      if (capture) output.push(data);
      else if (!secretOutput) process.stdout.write(data);
      if (logging && !secretOutput) appendFileSync(logFile, data);
    });
    child.stderr.on("data", (data) => {
      process.stderr.write(data);
      if (logging && !secretOutput) appendFileSync(logFile, data);
    });
    child.on("error", (error) =>
      reject(new Error(`${program}: ${error.message}`)),
    );
    child.on("close", (code) => {
      child = undefined;
      if (code !== 0)
        reject(
          new Error(
            `Command failed (${code}): ${label}. Review the output; rerun the same --deploy command to resume.`,
          ),
        );
      else resolve(Buffer.concat(output).toString().trim());
    });
  });
}
function stellar(args, options) {
  return run(cliBinary, ["--config-dir", cliDirectory, ...args], options);
}
async function toolsCheck() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error("Node.js 22.12+ is required.");
  console.log(
    requireCliVersion(await run(cliBinary, ["--version"], { capture: true })),
  );
  const installed = await run("rustup", ["toolchain", "list"], {
    capture: true,
  });
  if (!/^1\.91\.0-/m.test(installed))
    throw new Error(
      "Install Rust: rustup toolchain install 1.91.0 --profile minimal --target wasm32v1-none",
    );
  const targets = await run(
    "rustup",
    ["target", "list", "--installed", "--toolchain", "1.91.0"],
    { capture: true },
  );
  if (!targets.includes("wasm32v1-none"))
    throw new Error("Run: rustup target add wasm32v1-none --toolchain 1.91.0");
  if (!existsSync(join(root, "node_modules/@stellar/stellar-sdk/package.json")))
    throw new Error("Install project dependencies first: npm ci");
}

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: "boolean" },
      "dry-run": { type: "boolean" },
      deploy: { type: "boolean" },
      "fund-wallet": { type: "string" },
      "print-oracle-commands": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(help);
    return;
  }
  if (
    [
      values.check,
      values["dry-run"],
      values.deploy,
      values["fund-wallet"],
      values["print-oracle-commands"],
    ].filter(Boolean).length > 1
  )
    throw new Error("Choose one action.\n" + help);
  if (values["print-oracle-commands"]) {
    if (!existsSync(stateFile)) throw new Error("Deploy first with --deploy.");
    console.log(
      oracleCommands(
        JSON.parse(readFileSync(stateFile, "utf8")),
        cliDirectory,
        values["print-oracle-commands"],
      ),
    );
    return;
  }
  if (values["dry-run"]) {
    console.log(
      help +
        `\nDeployment plan:
1. Check Node, Rust, Stellar CLI and the fixed Testnet RPC/passphrase.
2. Run contract tests, build fresh WASM and check frontend ABI encodings.
3. Create/reuse three isolated Keychain-backed test identities; fund missing accounts.
4. Deploy the deterministic USDC asset contract; trust and fund writer/buyer accounts.
5. Deploy/reuse mock oracle and options contracts using saved random salts.
6. Verify deployed WASM hashes and constructor configuration.
7. Save public addresses and checksums; back up .env.local, update only its network settings.
8. Print wallet funding, oracle fixture and local restart instructions.
No commands have been executed and no files have been written.`,
    );
    return;
  }
  await toolsCheck();
  const {
    Account,
    Address,
    Asset,
    BASE_FEE,
    Contract,
    Networks,
    StrKey,
    TransactionBuilder,
    scValToNative,
    rpc,
  } = await import("@stellar/stellar-sdk");
  const server = new rpc.Server(TESTNET_RPC, { timeout: 30 });
  const [network, health] = await Promise.all([
    server.getNetwork(),
    server.getHealth(),
  ]);
  if (
    network.passphrase !== TESTNET_PASSPHRASE ||
    Networks.TESTNET !== TESTNET_PASSPHRASE ||
    health.status !== "healthy"
  )
    throw new Error(
      "RPC is not healthy Stellar Testnet. No deployment performed.",
    );
  console.log(
    `Verified Stellar Testnet (protocol ${network.protocolVersion}); RPC healthy.`,
  );
  if (!values.deploy && !values["fund-wallet"]) {
    console.log(
      "Checks passed. No keys created or transactions sent. Run ./deploy-testnet.sh --deploy when ready.",
    );
    return;
  }
  if (
    values["fund-wallet"] &&
    !StrKey.isValidEd25519PublicKey(values["fund-wallet"])
  )
    throw new Error(
      "--fund-wallet requires a public G-address, never a secret key.",
    );

  process.umask(0o077);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  try {
    writeFileSync(lockFile, `${process.pid}\n`, { flag: "wx", mode: 0o600 });
  } catch {
    throw new Error(
      "Another deployment may be running. Check .testnet-deployment/running.lock; remove that lock only after confirming the previous process stopped.",
    );
  }
  logging = true;
  let state;
  const save = () =>
    atomicWrite(stateFile, JSON.stringify(state, null, 2) + "\n");
  const identity = (role) => `steption-${state.runId}-${role}`;
  async function read(id, method, args = []) {
    const tx = new TransactionBuilder(
      new Account(StrKey.encodeEd25519PublicKey(new Uint8Array(32)), "0"),
      { fee: BASE_FEE, networkPassphrase: TESTNET_PASSPHRASE },
    )
      .addOperation(new Contract(id).call(method, ...args))
      .setTimeout(60)
      .build();
    const result = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(result) || !result.result)
      throw new Error(
        `Unable to read ${method}: ${result.error || "missing result"}`,
      );
    return scValToNative(result.result.retval);
  }
  async function instance(id) {
    const result = await server.getLedgerEntries(
      new Contract(id).getFootprint(),
    );
    return decodeInstanceEntries(result.entries);
  }
  async function account(address) {
    const response = await fetch(`${HORIZON}/accounts/${address}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(`Testnet Horizon returned ${response.status}.`);
    return response.json();
  }
  async function fundAccount(address, alias) {
    if (await account(address)) return;
    if (alias) await stellar(["keys", "fund", alias, ...networkArgs]);
    else {
      const response = await fetch(
        `https://friendbot.stellar.org/?addr=${address}`,
        { signal: AbortSignal.timeout(45000) },
      );
      if (!response.ok)
        throw new Error(
          `Friendbot returned ${response.status}. Retry after checking account funding.`,
        );
      console.log(`Funded Testnet XLM for ${address}.`);
    }
    for (let attempt = 0; attempt < 10; attempt++) {
      if (await account(address)) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(
      "Account funding is not yet visible. Rerun after checking Testnet.",
    );
  }
  async function mintTo(address, alias) {
    await fundAccount(address, alias);
    let details = await account(address);
    const trustline = () =>
      details.balances.find(
        (b) =>
          b.asset_code === "USDC" && b.asset_issuer === state.accounts.deployer,
      );
    if (!trustline()) {
      if (!alias)
        throw new Error(
          `In Freighter or Stellar Lab, add a Testnet trustline for USDC issued by ${state.accounts.deployer}, then rerun --fund-wallet ${address}. No wallet secret is needed by this script.`,
        );
      await stellar([
        "tx",
        "new",
        "change-trust",
        "--source-account",
        alias,
        ...networkArgs,
        "--line",
        `USDC:${state.accounts.deployer}`,
      ]);
      // RPC token reads below also confirm the trustline on the ledger.
      for (let attempt = 0; attempt < 10 && !trustline(); attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        details = await account(address);
      }
    }
    if (
      !trustline() ||
      trustline().is_authorized === false ||
      atomsFromBalance(trustline().limit) < TARGET_BALANCE
    )
      throw new Error(
        "A valid authorized trustline with a limit of at least 1,000 USDC is required.",
      );
    const balance = await read(state.token, "balance", [
      new Address(address).toScVal(),
    ]);
    const amount = topUpAmount(balance);
    assertMintReconciled(state.pendingMint, amount);
    if (amount > 0n) {
      state.pendingMint = {
        address,
        amount: String(amount),
        balanceBefore: String(balance),
        startedAt: new Date().toISOString(),
      };
      save();
      await stellar([
        "contract",
        "invoke",
        "--id",
        state.token,
        "--source-account",
        identity("deployer"),
        ...networkArgs,
        "--",
        "mint",
        "--to",
        address,
        "--amount",
        String(amount),
      ]);
    }
    if (
      (await read(state.token, "balance", [new Address(address).toScVal()])) <
      TARGET_BALANCE
    )
      throw new Error(
        "Test token funding has not been confirmed. Check the log before retrying.",
      );
    if (state.pendingMint?.address === address) delete state.pendingMint;
    save();
    console.log(`${address} has at least 1,000 test USDC.`);
  }
  async function verifyDeployment() {
    for (const role of ["oracle", "options"]) {
      const entry = await instance(state[role]);
      if (instanceWasmHash(entry) !== state.wasm[role])
        throw new Error(
          `${role} contract is missing, archived or differs from recorded WASM. Stop and inspect the deployment; Testnet may have reset.`,
        );
    }
    const config = await read(state.options, "get_config");
    if (
      config.admin !== state.accounts.deployer ||
      config.oracle !== state.oracle ||
      config.token !== state.token ||
      BigInt(config.resolution) !== 300n ||
      config.oracle_decimals !== 7
    )
      throw new Error(
        "Deployed options configuration does not match this deployment.",
      );
    if (
      (await read(state.token, "decimals")) !== 7 ||
      (await read(state.token, "symbol")) !== "USDC"
    )
      throw new Error("Unexpected test collateral metadata.");
  }
  try {
    if (existsSync(stateFile))
      state = validateState(JSON.parse(readFileSync(stateFile, "utf8")));
    else {
      if (values["fund-wallet"])
        throw new Error("Deploy first with ./deploy-testnet.sh --deploy.");
      state = {
        version: 1,
        network: TESTNET_PASSPHRASE,
        rpc: TESTNET_RPC,
        runId: randomBytes(6).toString("hex"),
        createdAt: new Date().toISOString(),
        salts: {
          oracle: randomBytes(32).toString("hex"),
          options: randomBytes(32).toString("hex"),
        },
        accounts: {},
      };
      save();
    }
    if (values["fund-wallet"]) {
      if (!state.complete)
        throw new Error("Finish --deploy before funding a wallet.");
      await verifyDeployment();
      await mintTo(values["fund-wallet"]);
      return;
    }
    console.log(
      "Building and testing the contracts before any deployment transaction…",
    );
    await run("cargo", ["test", "--workspace", "--locked"]);
    await run("cargo", [
      "build",
      "--target",
      "wasm32v1-none",
      "--release",
      "--locked",
    ]);
    await run("npm", ["run", "test:abi"]);
    const wasmPaths = {
      oracle: join(
        root,
        "target/wasm32v1-none/release/steption_mock_oracle.wasm",
      ),
      options: join(root, "target/wasm32v1-none/release/steption_options.wasm"),
    };
    const hashes = Object.fromEntries(
      Object.entries(wasmPaths).map(([name, path]) => [
        name,
        sha256(readFileSync(path)),
      ]),
    );
    if (state.wasm && JSON.stringify(state.wasm) !== JSON.stringify(hashes))
      throw new Error(
        "Contract source/WASM changed since this deployment began. Keep the saved state; use a separate project checkout for a new deployment.",
      );
    state.wasm = hashes;
    state.sourceCommit = await run("git", ["rev-parse", "HEAD"], {
      capture: true,
    });
    state.sourceDirty = !!(await run("git", ["status", "--porcelain"], {
      capture: true,
    }));
    save();
    mkdirSync(cliDirectory, { recursive: true, mode: 0o700 });
    for (const role of ["deployer", "writer", "buyer"]) {
      const alias = identity(role);
      // Only generate when the isolated identity is absent; never overwrite keys.
      const names = await stellar(["keys", "ls"], { capture: true });
      if (!names.split(/\s+/).includes(alias)) {
        if (state.accounts[role])
          throw new Error(
            `Saved ${role} identity is missing. Restore its Keychain/config backup; do not replace its key.`,
          );
        await stellar(["keys", "generate", alias, "--secure-store"], {
          secretOutput: true,
        });
      }
      const address = await stellar(["keys", "address", alias], {
        capture: true,
      });
      if (
        !StrKey.isValidEd25519PublicKey(address) ||
        (state.accounts[role] && state.accounts[role] !== address)
      )
        throw new Error(`Unexpected ${role} public address.`);
      state.accounts[role] = address;
      save();
      if (!state.complete) await fundAccount(address, alias);
    }
    const token = new Asset("USDC", state.accounts.deployer).contractId(
      TESTNET_PASSPHRASE,
    );
    if (state.token && state.token !== token)
      throw new Error("Recorded token does not match the deployment issuer.");
    state.token = token;
    save();
    if (!(await instance(token))) {
      if (state.complete)
        throw new Error(
          "Completed token deployment is missing. Check for a Testnet reset.",
        );
      await stellar([
        "contract",
        "asset",
        "deploy",
        "--asset",
        `USDC:${state.accounts.deployer}`,
        "--source-account",
        identity("deployer"),
        ...networkArgs,
      ]);
      if (!(await instance(token)))
        throw new Error(
          "Token deployment was not confirmed. Rerun to reconcile its deterministic address.",
        );
    }
    for (const role of ["oracle", "options"]) {
      const id = await stellar(
        [
          "contract",
          "id",
          "wasm",
          "--salt",
          state.salts[role],
          "--source-account",
          identity("deployer"),
          ...networkArgs,
        ],
        { capture: true },
      );
      if (!StrKey.isValidContract(id) || (state[role] && state[role] !== id))
        throw new Error(`Unexpected ${role} contract ID.`);
      state[role] = id;
      save(); // Persist expected address before submission, including uncertain outcomes.
      if (!(await instance(id))) {
        if (state.complete)
          throw new Error(
            "A completed contract is missing or archived. Inspect Testnet state before continuing.",
          );
        const constructor = ["--admin", state.accounts.deployer];
        if (role === "options")
          constructor.push(
            "--collateral_token",
            token,
            "--oracle",
            state.oracle,
          );
        await stellar([
          "contract",
          "deploy",
          "--wasm",
          wasmPaths[role],
          "--optimize=false",
          "--salt",
          state.salts[role],
          "--source-account",
          identity("deployer"),
          ...networkArgs,
          "--",
          ...constructor,
        ]);
      }
      const entry = await instance(id);
      if (instanceWasmHash(entry) !== hashes[role])
        throw new Error(
          `Unable to confirm exact ${role} WASM. Rerun to reconcile; no new salt will be generated.`,
        );
    }
    await verifyDeployment();
    if (!state.complete)
      for (const role of ["writer", "buyer"])
        await mintTo(state.accounts[role], identity(role));
    const envFile = join(root, ".env.local");
    const previous = existsSync(envFile)
      ? readFileSync(envFile, "utf8")
      : readFileSync(join(root, ".env.example"), "utf8");
    const updated = frontendEnv(previous, state.options);
    if (previous !== updated || !existsSync(envFile)) {
      if (existsSync(envFile))
        atomicWrite(
          join(directory, `env.local.before-${Date.now()}.backup`),
          previous,
        );
      atomicWrite(envFile, updated);
    }
    state.complete = true;
    state.verifiedAt = new Date().toISOString();
    save();
    console.log(
      `\nTestnet deployment verified.\nOptions: ${state.options}\nOracle (mock): ${state.oracle}\nCollateral: ${state.token}\nTest USDC issuer: ${state.accounts.deployer}\n\n.env.local is configured. Restart locally:\n  ./start.sh --stop\n  ./start.sh\n\nMarkets start empty. Create an offer in the app after funding your Freighter wallet:\n  ./deploy-testnet.sh --fund-wallet YOUR_PUBLIC_G_ADDRESS\nThe helper explains the required USDC trustline if it is missing.\n\nMock observations are NOT live prices. For settlement fixtures, run:\n  ./deploy-testnet.sh --print-oracle-commands EXPIRY_UNIX\nSee @stellar-options-dev-brief/MAC_TESTNET_SCRIPT.md for the full workflow.\nDeployment state: ${stateFile}`,
    );
  } finally {
    logging = false;
    rmSync(lockFile, { force: true });
  }
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (child) child.kill(signal);
    else {
      if (logging) rmSync(lockFile, { force: true });
      process.exit(130);
    }
  });
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
