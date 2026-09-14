# Steption — Stellar options development release

A redesigned Next.js app and a new Soroban options contract for your **later manual Stellar Testnet deployment**. Nothing in this package automatically deploys, creates keys, or moves assets.

## Run the app

Use Node 22.12+ (Node 22 LTS recommended).

From the repository root:

```sh
./start.sh              # Start website, app and API in the background
./start.sh --status     # Check the managed server
./start.sh --stop       # Stop the managed server
./start.sh --port 3002  # Start on another port if 3001 is occupied
```

Open `http://127.0.0.1:3001/` for the website and `/app` for the app. The launcher installs missing or outdated dependencies, creates `.env.local` from the example only when absent, preserves existing Testnet settings, and waits for the homepage to respond. Logs are in `.local-run/server.log`. It works from other directories too when invoked by its path.

Preview mode supports local paper trading without a wallet or blockchain. Testnet mode uses your configured remote Stellar RPC and deployed contracts. The launcher does not run a local Stellar blockchain or deploy contracts; follow the manual Testnet guide for on-chain testing. Restart after changing `.env.local`.

To run the development process in the foreground instead:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Next.js. Preview mode works without keys or contract configuration. Sample markets support search, filtering, sorting, favorites, payoff inspection and local paper trades. Paper positions survive refresh and retain their original expiry dates. Reset them in Portfolio.

The public website is at `/`. The app opens at the original `/app` route, with `/markets`, `/portfolio`, `/liquidity`, `/settlement`, and `/learn` also available. Run all commands from this existing repository root. `@stellar-options-dev-brief` contains supporting documentation only.

## What changed

- Stellar-inspired black, white and yellow design with responsive market tables and native dialogs. Layout inspiration: [Pendle markets](https://app.pendle.finance/trade/markets). Brand reference: [Stellar resources](https://stellar.org/brand-resources).
- Next.js 16.3.4, React 19.3.0, Stellar JavaScript SDK 17.0.1, Freighter API 6.0.1 and Soroban SDK 27.0.6. Dependency graphs are recorded in lockfiles.
- Functional contract reads/writes replace the older stubbed service. Every write verifies the Testnet RPC and wallet account, simulates, requests a signature, submits and checks ledger confirmation.
- European **puts and capped calls**, fixed-premium writer offers, 1 XLM per whole lot, seven-decimal USDC accounting, upfront collateral and permissionless settlement/claims.
- Deterministic historical XLM/USDC pricing, constructed from XLM/USD and USDC/USD. Buying closes before the first settlement observation.
- Portfolio loads positions from contract state. Writing replaces the simulated shared-pool/APY model with explicit collateralized inventory. Positions are nontransferable.
- Freighter replaces the incomplete passkey/Launchtube setup. No sponsored fees or smart-account delegation are claimed. Newsletter integration remains optional with server-only credentials.

## Deployment and verification

For Mac Terminal, use the root deployment script:

```sh
./deploy-testnet.sh --dry-run  # Print plan without side effects
./deploy-testnet.sh --check    # Read-only tools and Testnet health checks
./deploy-testnet.sh --deploy   # Deploy/resume and configure the local app
```

Requires Stellar CLI 28.0.0+, Node 22.12+ and the pinned Rust toolchain. It creates a custom test USDC asset and mock oracle, uses Keychain-backed identities and saves progress in Git-ignored `.testnet-deployment/`. See [Mac deployment instructions](@stellar-options-dev-brief/MAC_TESTNET_SCRIPT.md) for prerequisites, Freighter funding, fixture observations and retry behavior.

SEO is configured for `https://steptionprotocol.com`. The site includes per-page metadata and canonical URLs, an OG/Twitter image, FAQ and publisher structured data, sitemap, robots policy, `llms.txt`, API discovery headers and Markdown negotiation. Search and AI answers are permitted; AI training is disallowed by Content Signals. Development and preview deployments are noindex; production indexes the homepage, learning page and API docs.

Use the supplied `npm start` command for production. Its Node server preserves `Vary: Accept` alongside Next's own cache headers. Running `next start` directly bypasses that fix. See [SEO and agent setup](@stellar-options-dev-brief/SEO_GEO.md) for hosting, Search Console and validation instructions.

Follow **[@stellar-options-dev-brief/MANUAL_TESTNET.md](@stellar-options-dev-brief/MANUAL_TESTNET.md)** for deploy, wallet funding, oracle fixture and end-to-end smoke-test instructions.

```sh
npm run typecheck
npm run lint
npm test
npm run build
cargo test --workspace --locked
cargo build --target wasm32v1-none --release --locked
npm run testnet:check
```

The Rust toolchain is pinned to 1.91.0. The preinstalled Stellar CLI 21.2.0 is too old for this release; install CLI 28.0.0 or a compatible current stable release before deploying. `testnet:check` reads the network and, when configured, contract/oracle/token metadata; it never signs or submits.

## Development choices and limitations

The original research is preserved in `@stellar-options-dev-brief/research/`. Its agent instructions were treated as reference content. This implementation makes explicit development defaults; the source report is not a completed specification or an audit.

- Capped calls are deliberate: finite USDC collateral cannot cover an ordinary call’s unbounded payoff. Every order shows its cap.
- The contract supports at most 256 purchases and 256 written series per address in this testnet version. Global market discovery is paginated in batches of 64; the collateral card refers to loaded markets.
- Exact historical oracle records are required. Permanent history loss can lock claims. There is no discretionary admin price override. Run settlement promptly and resolve provider retention and failure recovery before production.
- The mock oracle is **administrator-controlled test infrastructure**, with immutable individual observations. It is not a production price source.
- Token identity and issuer must be checked during deployment; seven decimals and a symbol do not prove an asset is Circle USDC.
- These custom options contracts are unaudited. This is a local/testnet development release, not a mainnet release.

Read [@stellar-options-dev-brief/ARCHITECTURE.md](@stellar-options-dev-brief/ARCHITECTURE.md), [@stellar-options-dev-brief/STELLAR_UPDATES.md](@stellar-options-dev-brief/STELLAR_UPDATES.md), and [@stellar-options-dev-brief/VALIDATION.md](@stellar-options-dev-brief/VALIDATION.md) for the implemented model, verified sources, test evidence and remaining manual checks.

The GitHub Actions workflow runs directly from this repository root. The original Git repository, public assets and historical research folder are preserved.
