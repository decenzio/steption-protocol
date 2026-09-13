import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Address, StrKey, nativeToScVal, contract } from "@stellar/stellar-sdk";
const spec = contract.Spec.fromWasm(
  readFileSync("target/wasm32v1-none/release/steption_options.wasm"),
);
const actor = StrKey.encodeEd25519PublicKey(new Uint8Array(32));
const addr = new Address(actor).toScVal();
const u64 = (value) => nativeToScVal(value, { type: "u64" }),
  i128 = (value) => nativeToScVal(value, { type: "i128" });
const cases = [
  [
    "create_series",
    {
      writer: actor,
      is_call: true,
      strike: 2000000n,
      cap: 3000000n,
      expiry: 1800003600n,
      premium: 100000n,
      capacity: 100n,
    },
    [
      addr,
      nativeToScVal(true),
      i128(2000000n),
      i128(3000000n),
      u64(1800003600n),
      i128(100000n),
      u64(100n),
    ],
  ],
  [
    "buy",
    {
      series_id: 1n,
      buyer: actor,
      quantity: 40n,
      max_premium: 4000000n,
      deadline: 1800000180n,
    },
    [u64(1n), addr, u64(40n), i128(4000000n), u64(1800000180n)],
  ],
  ["cancel_inventory", { series_id: 1n, quantity: 3n }, [u64(1n), u64(3n)]],
  ["settle", { series_id: 1n }, [u64(1n)]],
  ["claim", { position_id: 1n }, [u64(1n)]],
  ["claim_writer", { series_id: 1n }, [u64(1n)]],
  ["get_series", { id: 1n }, [u64(1n)]],
  ["get_position", { id: 1n }, [u64(1n)]],
  ["positions_of", { owner: actor }, [addr]],
  ["written_by", { owner: actor }, [addr]],
  ["get_config", {}, []],
  ["series_count", {}, []],
];
for (const [name, args, manual] of cases) {
  const generated = spec.funcArgsToScVals(name, args);
  assert.deepEqual(
    manual.map((v) => v.toXdr("base64")),
    generated.map((v) => v.toXdr("base64")),
    name,
  );
}
const oracle = contract.Spec.fromWasm(
  readFileSync("target/wasm32v1-none/release/steption_mock_oracle.wasm"),
);
assert.equal(
  oracle.funcResToNative("resolution", nativeToScVal(300, { type: "u32" })),
  300,
);
console.log(
  `ABI checks passed: ${cases.length} frontend methods match compiled WASM; oracle resolution is SEP-40 u32.`,
);
