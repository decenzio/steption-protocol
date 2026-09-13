import assert from "node:assert/strict";
import test from "node:test";
import { atoms, decimal, lots, payout } from "../app/lib/amount";
test("amounts retain exact 7-decimal precision", () => {
  for (const value of ["0", "0.0000001", "0.1234567", "1", "100000"])
    assert.equal(atoms(decimal(atoms(value))), atoms(value));
  assert.equal(atoms("0.1") * 3n, 3_000_000n);
});
test("rejects ambiguous or oversized amounts and lots", () => {
  for (const value of [
    "-1",
    "1e4",
    "NaN",
    "Infinity",
    ".1",
    "1.00000001",
    "1000000",
    "",
  ])
    assert.throws(() => atoms(value));
  for (const value of ["0", "1.1", "-1", "1e2", "1000000001"])
    assert.throws(() => lots(value));
});
test("bounded payoff and reserve conservation across scenarios", () => {
  for (const isCall of [false, true])
    for (let n = 1n; n < 100n; n += 7n)
      for (let price = 0n; price < 5000000n; price += 111111n) {
        const strike = 2000000n,
          cap = 3000000n;
        const reserve = (isCall ? cap - strike : strike) * n;
        const gross = payout(isCall, strike, cap, price) * n;
        assert(gross >= 0n && gross <= reserve);
        assert.equal(gross + (reserve - gross), reserve);
      }
});
