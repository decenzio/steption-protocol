import { createHash } from "node:crypto";
import { writeFileSync, renameSync } from "node:fs";

export const TESTNET_RPC = "https://soroban-testnet.stellar.org";
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON = "https://horizon-testnet.stellar.org";
export const networkArgs = [
  "--rpc-url",
  TESTNET_RPC,
  "--network-passphrase",
  TESTNET_PASSPHRASE,
];
export const TARGET_BALANCE = 10_000_000_000n; // 1,000 test USDC

export function cleanCliEnv(env = process.env) {
  // Explicit arguments must not inherit a different network, signer or fee.
  return Object.fromEntries(
    Object.entries(env).filter(
      ([key]) =>
        !key.startsWith("STELLAR_") &&
        !key.startsWith("SOROBAN_") &&
        key !== "RUST_LOG",
    ),
  );
}
export function requireCliVersion(output) {
  const match = output.match(/^stellar (\d+)\.(\d+)\.(\d+)/m);
  if (!match || Number(match[1]) < 28)
    throw new Error(
      "Stellar CLI 28.0.0+ is required. On Mac: brew install stellar-cli (or brew upgrade stellar-cli). Alternatively: cargo install --locked stellar-cli --version 28.0.0. Then run: hash -r; stellar --version",
    );
  return match[0];
}
export function atomsFromBalance(value) {
  if (!/^\d+(?:\.\d{1,7})?$/.test(value))
    throw new Error("Invalid on-chain balance.");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"));
}
export function topUpAmount(value) {
  const balance = typeof value === "bigint" ? value : atomsFromBalance(value);
  return balance < TARGET_BALANCE ? TARGET_BALANCE - balance : 0n;
}
export function assertMintReconciled(pending, amount) {
  if (pending && amount > 0n)
    throw new Error(
      "An earlier mint has an uncertain result. Check transactions.log and the recipient balance before clearing pendingMint in deployment.json. The script will not repeat an uncertain mint automatically.",
    );
}
export const shellQuote = (value) =>
  `'${String(value).replace(/'/g, `'"'"'`)}'`;
export function oracleCommands(state, configDir, expiry) {
  validateState(state);
  if (
    !state.complete ||
    !/^C[A-Z2-7]{55}$/.test(state.oracle || "") ||
    !/^\d+$/.test(expiry)
  )
    throw new Error(
      "A completed deployment and an expiry Unix timestamp are required.",
    );
  const timestamp = BigInt(expiry);
  if (timestamp < 900n || timestamp % 300n !== 0n)
    throw new Error("Expiry must align to 300 seconds.");
  const result = [
    "# Mock fixture only: XLM = 0.10 USD; USDC = 1 USD. Wait until expiry before running.",
  ];
  for (let offset = 1n; offset <= 3n; offset++)
    for (const [asset, price] of [
      ["XLM", "1000000"],
      ["USDC", "10000000"],
    ]) {
      result.push(
        [
          "stellar",
          "--config-dir",
          configDir,
          "contract",
          "invoke",
          "--id",
          state.oracle,
          "--source-account",
          `steption-${state.runId}-deployer`,
          ...networkArgs,
          "--",
          "set_price",
          "--asset",
          JSON.stringify({ Other: asset }),
          "--timestamp",
          String(timestamp - offset * 300n),
          "--value",
          price,
        ]
          .map(shellQuote)
          .join(" "),
      );
    }
  return result.join("\n");
}
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function decodeInstanceEntries(entries) {
  if (!entries.length) return null;
  const data = entries[0].val;
  if (
    data.type !== "contractData" ||
    data.value.val.type !== "scvContractInstance"
  )
    throw new Error("RPC returned an unexpected contract instance entry.");
  return data.value.val.value;
}
export function instanceWasmHash(instance) {
  if (instance?.executable.type !== "contractExecutableWasm") return null;
  return Buffer.from(instance.executable.value.value).toString("hex");
}
export function atomicWrite(path, content) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, content, { mode: 0o600 });
  renameSync(temporary, path);
}
export function frontendEnv(previous, contractId) {
  const updates = new Map([
    ["NEXT_PUBLIC_APP_MODE", "testnet"],
    ["NEXT_PUBLIC_RPC_URL", TESTNET_RPC],
    ["NEXT_PUBLIC_OPTIONS_CONTRACT_ID", contractId],
  ]);
  const seen = new Set();
  const lines = previous.split(/\r?\n/).flatMap((line) => {
    const key = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/)?.[1];
    if (!updates.has(key)) return [line];
    if (seen.has(key)) return [];
    seen.add(key);
    return [`${key}=${updates.get(key)}`];
  });
  for (const [key, value] of updates)
    if (!seen.has(key)) lines.push(`${key}=${value}`);
  return `${lines.join("\n").replace(/\n*$/, "")}\n`;
}
export function validateState(state) {
  if (
    state.version !== 1 ||
    state.network !== TESTNET_PASSPHRASE ||
    !/^[a-f0-9]{12}$/.test(state.runId) ||
    ![state.salts?.oracle, state.salts?.options].every((s) =>
      /^[a-f0-9]{64}$/.test(s),
    )
  )
    throw new Error(
      "Deployment state is invalid or not Testnet. Do not reuse it for another network.",
    );
  return state;
}
