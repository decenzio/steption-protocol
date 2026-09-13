export const SCALE = 10_000_000n;
export function atoms(value: string): bigint {
  if (!/^\d+(\.\d{1,7})?$/.test(value))
    throw new Error("Use a positive amount with at most 7 decimals.");
  const [whole, fraction = ""] = value.split(".");
  const result = BigInt(whole) * SCALE + BigInt(fraction.padEnd(7, "0"));
  if (result > 1_000_000_000_000n)
    throw new Error("Amount exceeds the testnet limit.");
  return result;
}
export function decimal(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const v = value < 0n ? -value : value;
  return `${sign}${v / SCALE}.${(v % SCALE).toString().padStart(7, "0")}`.replace(
    /\.?0+$/,
    "",
  );
}
export function lots(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value))
    throw new Error("Enter a whole number of lots, at least 1.");
  const result = BigInt(value);
  if (result > 1_000_000_000n) throw new Error("Maximum 1 billion lots.");
  return result;
}
export function payout(
  isCall: boolean,
  strike: bigint,
  cap: bigint,
  spot: bigint,
): bigint {
  if (strike <= 0n || spot < 0n || (isCall && cap <= strike))
    throw new Error("Invalid option terms.");
  if (!isCall) return strike > spot ? strike - spot : 0n;
  return spot <= strike ? 0n : spot >= cap ? cap - strike : spot - strike;
}
