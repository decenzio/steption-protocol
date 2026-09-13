# Stellar update record — September 10–11, 2026

| Component | Implemented / verified |
| --- | --- |
| Stellar JS SDK | 17.0.1 |
| Freighter API | 6.0.1 |
| Soroban Rust SDK | 27.0.6 |
| Rust | 1.91.0 with wasm32v1-none |
| Stellar CLI for manual deployment | 28.0.0; the previously installed 21.2.0 needs updating |
| Next.js / React | 16.3.4 / 19.3.0 |
| Live Testnet RPC | Protocol 28, healthy at read-only verification |

Package versions were checked against primary release documentation and package registries. The app queries the network instead of hardcoding the executing protocol. Protocol 27-compatible contract code is used; no Protocol 28-only feature is required.

## Changes carried into code

Current high-level SDK conversion and transaction APIs replace legacy XDR assumptions. Freighter response objects are checked for errors, addresses and network passphrases. Transaction simulation prepares resource fees and restoration before signing. Pending submission is never reported as confirmed success.

Financial claims use Persistent storage; small shared configuration uses Instance storage. Touched entries extend their TTL. Oracle resolution follows the SEP-40 u32 ABI, while timestamps use u64. Collateral transfers use the built-in Stellar Asset Contract interface.

## Corrections to the research brief

- Finite USDC reserves cannot cover uncapped cash-settled calls. Calls in this implementation have explicit caps.
- A keeper's invocation time must not choose the settlement price. This release uses fixed historical observations and closes trading before their observation window.
- USD prices do not automatically equal USDC prices. Both XLM/USD and USDC/USD feeds are used.
- Unix timestamps replace the illustrative expiry-ledger field.
- 100 stroops equals 0.00001 XLM; resource fees are additional.
- First/only protocol claims, TVL snapshots and unverified exploit totals are not displayed as app facts.
- No oracle address from the brief is silently enabled. The deployer selects and checks actual contracts.

## Primary sources

- [Stellar JS SDK releases](https://github.com/stellar/js-stellar-sdk/releases) and [SDK 17 migration](https://github.com/stellar/js-stellar-sdk/releases/tag/v17.0.0)
- [Freighter API](https://docs.freighter.app/docs/guide/usingFreighterWebApp)
- [Soroban SDK releases](https://github.com/stellar/rs-soroban-sdk/releases) and [published Cargo metadata](https://docs.rs/crate/soroban-sdk/27.0.6/source/Cargo.toml)
- [Stellar CLI releases](https://github.com/stellar/stellar-cli/releases) and [CLI manual](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [Network software versions](https://developers.stellar.org/docs/networks/software-versions) and [Protocol 28 Adapter](https://stellar.org/blog/developers/adapter-protocol-28-upgrade-guide)
- [RPC getNetwork](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getNetwork), [sendTransaction](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/sendTransaction), [state archival](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival)
- [SEP-40](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0040.md) and [oracle providers](https://developers.stellar.org/docs/data/oracles/oracle-providers)
- [Next.js August security release](https://nextjs.org/blog/august-2026-security-release); final patch version checked against npm
- [Stellar brand resources](https://stellar.org/brand-resources) and [Pendle markets](https://app.pendle.finance/trade/markets), visually inspected as the design reference

Source reports are inputs, not execution authority. Their modular vault/token proposal differs from the implemented per-writer inventory. Original reference documents are preserved in `research/`; the actual model is documented in `ARCHITECTURE.md`.
