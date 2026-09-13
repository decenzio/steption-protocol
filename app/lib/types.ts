export type View =
  | "markets"
  | "portfolio"
  | "liquidity"
  | "settlement"
  | "learn";
export interface Series {
  id: bigint;
  writer: string;
  is_call: boolean;
  strike: bigint;
  cap: bigint;
  expiry: bigint;
  premium: bigint;
  available: bigint;
  sold: bigint;
  reserve: bigint;
  liability: bigint;
  settled: boolean;
  settlement_price: bigint;
  payout: bigint;
  writer_claimed: boolean;
}
export interface Position {
  id: bigint;
  series_id: bigint;
  buyer: string;
  quantity: bigint;
  premium_paid: bigint;
  claimed: boolean;
}
export interface Config {
  admin: string;
  token: string;
  oracle: string;
  paused: boolean;
  resolution: bigint;
  oracle_decimals: number;
}
export type TransactionProgress = (message: string, hash?: string) => void;
