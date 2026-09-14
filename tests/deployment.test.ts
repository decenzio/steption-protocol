import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { Contract, Networks, StrKey, xdr } from "@stellar/stellar-sdk";
import {
  assertMintReconciled,
  atomsFromBalance,
  cleanCliEnv,
  decodeInstanceEntries,
  frontendEnv,
  instanceWasmHash,
  networkArgs,
  oracleCommands,
  requireCliVersion,
  shellQuote,
  TARGET_BALANCE,
  TESTNET_PASSPHRASE,
  topUpAmount,
  validateState,
} from "../scripts/deployment-utils.mjs";

test("deployment commands pin Testnet and reject the old CLI", () => {
  assert.equal(TESTNET_PASSPHRASE, Networks.TESTNET);
  assert.deepEqual(networkArgs, [
    "--rpc-url",
    "https://soroban-testnet.stellar.org",
    "--network-passphrase",
    Networks.TESTNET,
  ]);
  assert.throws(() => requireCliVersion("stellar 21.2.0 (old)"), /28.0.0/);
  assert.equal(
    requireCliVersion("stellar 28.0.0 (commit)\nstellar-xdr 28.0.0"),
    "stellar 28.0.0",
  );
  assert.throws(() => requireCliVersion("unrecognized binary"));
  assert.deepEqual(
    cleanCliEnv({
      PATH: "/bin",
      NODE_ENV: "test",
      STELLAR_NETWORK: "mainnet",
      STELLAR_ACCOUNT: "unsafe-default",
      STELLAR_SIGN_WITH_KEY: "secret",
      SOROBAN_RPC_URL: "elsewhere",
      RUST_LOG: "debug",
    }),
    { PATH: "/bin", NODE_ENV: "test" },
  );
});

test("frontend configuration changes exactly the three network settings", () => {
  const original =
    '# keep this comment\nSUPABASE_SERVICE_ROLE_KEY="keep-exactly"\nSITE_URL=https://steptionprotocol.com\nexport NEXT_PUBLIC_APP_MODE=preview\nNEXT_PUBLIC_OPTIONS_CONTRACT_ID=old\nNEXT_PUBLIC_OPTIONS_CONTRACT_ID=duplicate\n';
  const id = StrKey.encodeContract(Buffer.alloc(32, 1));
  const updated = frontendEnv(original, id);
  assert.ok(
    updated.includes(
      '# keep this comment\nSUPABASE_SERVICE_ROLE_KEY="keep-exactly"\nSITE_URL=https://steptionprotocol.com\n',
    ),
  );
  assert.equal(updated.match(/NEXT_PUBLIC_OPTIONS_CONTRACT_ID=/g)?.length, 1);
  assert.ok(updated.includes(`NEXT_PUBLIC_OPTIONS_CONTRACT_ID=${id}`));
  assert.ok(updated.includes("NEXT_PUBLIC_APP_MODE=testnet"));
  assert.ok(
    updated.includes("NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org"),
  );
  assert.equal(frontendEnv(updated, id), updated);
});

test("top-ups are exact and uncertain mints are never blindly repeated", () => {
  assert.equal(atomsFromBalance("999.9999999"), TARGET_BALANCE - 1n);
  assert.equal(topUpAmount("999.9999999"), 1n);
  assert.equal(topUpAmount(0n), TARGET_BALANCE);
  assert.equal(topUpAmount("1000.0000000"), 0n);
  assert.equal(topUpAmount("1500"), 0n);
  for (const value of ["-1", "1e4", "0.00000001", "NaN"])
    assert.throws(() => atomsFromBalance(value));
  assert.throws(
    () => assertMintReconciled({ address: "recipient" }, 1n),
    /uncertain/,
  );
  assert.doesNotThrow(() => assertMintReconciled({ address: "recipient" }, 0n));
  assert.doesNotThrow(() => assertMintReconciled(undefined, 10n));
});

test("contract verification uses current SDK property-based XDR types", () => {
  const id = StrKey.encodeContract(Buffer.alloc(32, 2));
  const key = new Contract(id).getFootprint();
  assert.equal(key.type, "contractData");
  const executable = xdr.ContractExecutable.contractExecutableWasm(
    Buffer.alloc(32, 7),
  );
  const instance = new xdr.ScContractInstance({ executable, storage: null });
  const val = xdr.ScVal.scvContractInstance(instance);
  assert.equal(
    instanceWasmHash(
      decodeInstanceEntries([
        { val: { type: "contractData", value: { val } } },
      ]),
    ),
    "07".repeat(32),
  );
  assert.equal(decodeInstanceEntries([]), null);
  assert.equal(
    instanceWasmHash({
      executable: xdr.ContractExecutable.contractExecutableStellarAsset(),
    }),
    null,
  );
  assert.throws(() => decodeInstanceEntries([{ val: { type: "account" } }]));
});

test("resume state and printed oracle commands validate the deployment and quote paths", () => {
  const state = {
    version: 1,
    network: Networks.TESTNET,
    runId: "abcdef123456",
    salts: { oracle: "ab".repeat(32), options: "cd".repeat(32) },
    complete: true,
    oracle: StrKey.encodeContract(Buffer.alloc(32, 3)),
  };
  assert.equal(validateState(state), state);
  assert.throws(() => validateState({ ...state, network: Networks.PUBLIC }));
  assert.throws(() => validateState({ ...state, runId: "bad;command" }));
  const configDir = "/tmp/project's folder/cli";
  const commands = oracleCommands(state, configDir, "1800000000");
  assert.equal(commands.split("\n").length, 7);
  assert.match(commands, /steption-abcdef123456-deployer/);
  assert.match(commands, /1799999700/);
  assert.match(commands, /1799999100/);
  execFileSync("/bin/bash", ["-n"], { input: commands });
  const literal = "text' $(echo should-not-expand) `echo nope`";
  assert.equal(
    execFileSync("/bin/bash", ["-c", `printf '%s' ${shellQuote(literal)}`], {
      encoding: "utf8",
    }),
    literal,
  );
  assert.throws(() => oracleCommands(state, configDir, "1800000001"));
});
