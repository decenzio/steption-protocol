import type { Series } from "./types";
import { atoms } from "./amount";
// Illustrative inventory, never substituted when Testnet RPC fails.
export function sampleSeries(base?: number): Series[] {
  const start = base ?? Math.floor(Date.now() / 86400000) * 86400;
  return [
    [false, "0.18", "0", "0.0092", 7, 120000],
    [true, "0.20", "0.30", "0.0078", 7, 85000],
    [false, "0.20", "0", "0.0184", 14, 64000],
    [true, "0.22", "0.35", "0.0086", 14, 92000],
    [false, "0.16", "0", "0.0051", 30, 150000],
    [true, "0.25", "0.40", "0.0064", 30, 75000],
  ].map((row, i) => {
    const [isCall, strike, cap, premium, days, capacity] = row as [
      boolean,
      string,
      string,
      string,
      number,
      number,
    ];
    const unit = isCall ? atoms(cap) - atoms(strike) : atoms(strike);
    return {
      id: BigInt(i + 1),
      writer: "Illustrative writer",
      is_call: isCall,
      strike: atoms(strike),
      cap: atoms(cap),
      premium: atoms(premium),
      expiry: BigInt(start + days * 86400 + 57600),
      available: BigInt(capacity),
      sold: 0n,
      reserve: unit * BigInt(capacity),
      liability: 0n,
      settled: false,
      settlement_price: 0n,
      payout: 0n,
      writer_claimed: false,
    };
  });
}
