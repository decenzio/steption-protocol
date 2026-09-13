# Validation record

Prepared September 11, 2026. No contract deployment, key creation or signed network transaction was performed.

## Automated checks

- TypeScript typecheck and ESLint.
- Three TypeScript tests: exact decimal conversion, rejected malformed quantities and bounded-payoff/reserve invariants.
- 17 Rust contract tests covering payoff boundaries, reserve conservation, claim ordering, duplicate claims, cancellations, permissionless fixed-recipient claims, authorization failures, pause behavior, inventory/slippage/deadline checks, exact expiry/cutoff timing, immutable historical settlement, USDC depeg conversion, missing/malformed oracle data and atomic rollback after failed token transfers.
- Optimized WASM builds for both contracts using Rust 1.91.0 and Soroban SDK 27.0.6.
- SDK contract-spec checks: 12 frontend method encodings match the compiled options WASM; the mock oracle's resolution return is SEP-40 u32.
- Next.js production build includes every application route and newsletter endpoint.
- npm audit reports zero known vulnerabilities after updating the inherited dependency lockfile.
- HTTP checks verify the application routes and existing `/app` entry point; missing newsletter configuration returns 503 instead of pretending to subscribe.
- The read-only Stellar RPC preflight returned healthy Testnet status and Protocol 28. No deployed options ID was configured, so live contract/oracle reads remain a deployment-time check.

## Independent read-only review corrections

Review found and corrected an oracle ABI mismatch, trading after observations could become known, a globally exhaustible series quota, loss of exact order-term precision, incorrect UTC time labels, reserve underreporting after writer refunds, a wallet refresh race, movable sample expiry dates and transaction-hash comparison. The tests include the financially consequential boundaries. This is not a professional audit.

## Local preview

A macOS file-descriptor limit affected Next.js native development watching. The dev launcher uses Watchpack polling, and the app was served successfully afterward. This is scoped to the development process; no system limits or user settings were changed.

## Remaining manual acceptance

The complete deployment smoke-test procedure is in `MANUAL_TESTNET.md`. After your manual deployment, verify Freighter connection/rejection/network/account changes, real token balances/trustlines, contract reads, transaction confirmation links, writer creation/cancellation, buyer purchase, historical oracle settlement and both claim orders.

Signed wallet flows and browser interaction/acceptance testing against deployed contracts have not been performed. Real oracle metadata, asset issuer and history retention must be verified for the contracts you choose. No mainnet readiness or audit coverage is claimed.

## Root integration correction

The public website is restored at `/`, including protocol overview, how-it-works, original team profiles, FAQ and newsletter. The updated app renders at `/app`. Both are built from the existing repository root. The `@stellar-options-dev-brief` directory now contains documentation only; the misplaced app and original root source were backed up before integration.

After integration, root dependency installation, TypeScript, ESLint, all three app tests, Next.js production build, both WASM builds and all 12 ABI checks passed. Root-built WASM hashes match the supplied artifacts. The development server runs from the repository root; HTTP checks returned 200 for `/`, `/app`, `/markets`, `/portfolio`, `/liquidity`, `/settlement` and `/learn`.

## SEO and agent discovery

Added canonical metadata for steptionprotocol.com, the 1200×630 OG image, sitemap, robots and Content Signals, Organization/WebSite/FAQ JSON-LD, descriptive image alt text, llms.txt, API Linkset/OpenAPI discovery, and Markdown negotiation. Seven total unit tests pass; typecheck, lint and production build pass. Read-only HTTP acceptance passes for both production indexing and local noindex preview, including representation cache headers. The social image was visually inspected. See `SEO_GEO.md` for deployment configuration and the complete checks.
