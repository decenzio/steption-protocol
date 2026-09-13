# Implemented architecture

The previous MVP client’s contract service was stubbed and described American options and shared pools. This release has a new ABI and must be deployed as a new contract. It does not migrate balances or positions from an old contract.

## Contract and application

`contracts/options` contains the registry, segregated collateral accounting, immutable terms, nontransferable position records and settlement engine in one Soroban contract. `crates/oracle-interface` defines the SEP-40 consumer ABI. Collateral uses the network's Stellar Asset Contract rather than a new token implementation. `contracts/mock-oracle` is a separate administrator-controlled fixture for deterministic testnet smoke tests.

The frontend uses high-level SDK values and a typed service in `app/lib/stellar.ts`. Reads are simulated; signing requires Freighter on Testnet. An RPC/passphrase mismatch blocks writes. No secret keys or service credentials are present in browser configuration. A single contract operation is simulated and prepared before signing. Only confirmed ledger success is reported as completion.

A connected address is stored as a reconnect hint only. Every write rechecks Freighter's actual account and network. Read generations prevent stale requests from overwriting current-account results. Reads do not fall back to preview data on failure.

## Financial model

All token and price quantities use seven decimal places (10,000,000 atoms = 1 USDC). Quantities are whole lots; 1 lot references 1 XLM. No floating point is used for contract accounting or transaction construction. JavaScript floating-point values are used only for chart coordinates and display formatting; final order terms show exact decimal values.

| Term | Put | Capped call |
| --- | --- | --- |
| Per-lot reserve | Strike | Cap minus strike |
| Gross per-lot payout | max(strike − price, 0) | min(max(price − strike, 0), cap − strike) |
| Buyer's net result | Gross payout − fixed premium | Gross payout − fixed premium |

The writer reserves the full maximum payout before inventory becomes available. Buyers transfer the fixed premium directly to the writer. No protocol trading fee or APY is asserted. Buyers also pay network fees in XLM. Unsold inventory can be cancelled; sold liability cannot be removed before settlement.

The oracle returns equally scaled XLM/USD and USDC/USD at identical timestamps. The contract computes `floor(XLM_price × 10^7 / USDC_price)` using checked multiplication. It then takes the median of three resulting XLM/USDC ratios. It does not assume a permanent USDC dollar peg.

## Timeline

Let expiry be E and the immutable oracle resolution be R seconds.

- Creation requires E at least four R intervals in the future and no more than one year away.
- E must align exactly to R.
- Buying is allowed only while `now < E − 3R`.
- Settlement samples are fixed at E − 3R, E − 2R and E − R.
- Permissionless settlement becomes valid at E + R, allowing publication delay.
- Settlement is idempotent. Every successful later call returns the original payout.

With the test oracle's five-minute resolution, buying closes 15 minutes before expiry; settlement opens five minutes after expiry. Provider observations must represent the declared historical bucket. The provider's own publication/finalization semantics require review before production.

The constructor validates a USD base, XLM/USDC asset support, seven-decimal collateral, oracle decimals ≤18 and a resolution of 1–86,400 seconds. The SEP-40 resolution ABI is `u32`; timestamp math widens it to `u64`. Settlement rechecks immutable metadata, exact timestamps and positive bounded prices. Missing or invalid observations reject the whole call atomically. No current-price substitution, mutable oracle source or admin-set settlement price exists.

## State, authorization and accounting

Configuration and counters use Instance storage. Series, positions and owner indexes use Persistent storage; touched entries extend TTL toward 30 days, with a seven-day threshold. Those are ledger counts based on a five-second estimate, not a wall-clock guarantee. Simulation handles archived-state restoration on current Stellar networks.

Writer authorization is required for creation and inventory cancellation. Buyer authorization is required for purchasing. Only the configured admin may pause/unpause. Pause prevents new creation/purchases, while cancellation, settlement and claims remain available.

Claims are permissionless because recipients are fixed in storage. Buyer claims always pay the recorded buyer; writer refunds always pay the recorded writer. State is marked before token transfer, and failed transfers roll the transaction back. Remaining reserve is always the actual unclaimed collateral. Writer refunds subtract outstanding buyer liability, so either claim order is valid.

Permissionless discovery has no global lifetime cap. The app loads 64 series at a time. Each address has an explicit testnet-only limit of 256 purchase records and 256 written series; there is no global quota that one writer can exhaust. The limit does not reset after claiming. A production indexer/accounting design should replace these per-address vector limits.

## Known production work

Independent contract review and audit; oracle retention/failure recovery; observable settlement keeper operations; richer position indexing and history; account and writer limits; provider finalization semantics; token issuer/clawback controls; admin composition; transferable tokens/secondary market if desired; relayer-backed passkeys if desired. These are not represented as implemented features.
