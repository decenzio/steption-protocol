# Deploy Steption to Testnet from Mac Terminal

Prepared September 13, 2026. The script has been checked locally; no keys, deployments or signed transactions were created during preparation.

## 1. Prerequisites

Open Terminal and enter the existing project:

```sh
cd /Users/roman/Desktop/web3/steption-protocol
```

Use Node 22.12 or newer. Install project dependencies:

```sh
npm ci
```

Your previously installed Stellar CLI is 21.2.0. This script requires 28.0.0 or newer. With Homebrew, install the CLI if it is not managed by Homebrew yet:

```sh
brew install stellar-cli
```

If Homebrew already manages it, use `brew upgrade stellar-cli`. Alternatively, install the checked version with `cargo install --locked stellar-cli --version 28.0.0`. Then verify the binary your terminal actually uses:

```sh
hash -r
type -a stellar
stellar --version
```

If an older installation appears first in PATH, fix that ordering or use `STEPTION_STELLAR_BIN=/absolute/path/to/stellar` when invoking the script. The script never upgrades tools or overwrites an existing CLI installation automatically.

Install the pinned contract toolchain if needed:

```sh
rustup toolchain install 1.91.0 --profile minimal --target wasm32v1-none
```

References: [official CLI installation](https://developers.stellar.org/docs/tools/cli/install-cli), [CLI manual](https://developers.stellar.org/docs/tools/cli/stellar-cli).

## 2. Inspect and check

```sh
./deploy-testnet.sh --dry-run
./deploy-testnet.sh --check
```

The dry run only prints the plan. It makes no network requests and writes no files. The check reads tool versions and the fixed Stellar Testnet RPC. It creates no accounts or contracts. Running the script without a flag is equivalent to `--check`.

## 3. Deploy

```sh
./deploy-testnet.sh --deploy
```

This is the command that creates keys and submits Testnet transactions. It:

1. Checks tools, RPC health and the exact Testnet network passphrase.
2. Runs the contract tests, builds fresh WASM from the pinned workspace and checks the frontend ABI.
3. Creates three isolated identities for deployer, writer and buyer. Their random deployment-specific names prevent collisions with existing identities. Secrets use macOS Keychain; Terminal may request normal Keychain access. The script never reads or exports secret keys.
4. Funds missing accounts with Testnet XLM through Friendbot.
5. Deploys a custom `USDC` Stellar Asset Contract, the included mock oracle and the options contract.
6. Checks the deployed WASM hashes and constructor configuration, creates the writer/buyer trustlines and tops their test collateral balances up to 1,000 USDC each.
7. Saves deployment addresses and hashes, backs up an existing `.env.local`, and changes only `NEXT_PUBLIC_APP_MODE`, `NEXT_PUBLIC_RPC_URL` and `NEXT_PUBLIC_OPTIONS_CONTRACT_ID`.

The custom token is not Circle USDC and has no real monetary value. The mock oracle contains manually supplied prices, not a live market feed. The script does not create option offers or buy positions, run a local blockchain, publish the website, or perform mainnet operations.

After success, restart the local app:

```sh
./start.sh --stop
./start.sh
```

Open `http://127.0.0.1:3001/app`. Markets begin empty. Create an offer using the Write options page after funding your Freighter wallet below. A production frontend needs rebuilding after its public environment variables change.

## 4. Fund your Freighter Testnet wallet

Select Testnet in Freighter and copy its public G-address. Run:

```sh
./deploy-testnet.sh --fund-wallet YOUR_PUBLIC_G_ADDRESS
```

Replace the placeholder with the actual address. No secret key is accepted or needed. The helper funds Testnet XLM if the account does not exist. If the USDC trustline is missing, it prints the deployment's issuer and stops. Add `USDC` with that exact issuer using Freighter or Stellar Lab, with a trustline limit of at least 1,000 USDC, then rerun the same command.

It tops the balance up to 1,000 test USDC; it does not add another 1,000 on every run. You can repeat this for a second Freighter account to test buying from a different writer. The script-created CLI writer and buyer identities are separate from Freighter and do not need to be imported into the browser.

## 5. Supply mock prices before testing settlement

Create an option with a five-minute-aligned expiry. Copy its expiry Unix timestamp, then print the six required fixture commands:

```sh
./deploy-testnet.sh --print-oracle-commands EXPIRY_UNIX
```

This command only prints commands, using the saved mock oracle, CLI config and deployer identity. It works without network requests. Replace EXPIRY_UNIX with the actual integer; do not use an ISO date string.

Wait until expiry, then run the printed commands in Terminal. They fix XLM at 0.10 USD and USDC at 1 USD at expiry minus 300, 600 and 900 seconds. This is a deterministic test scenario, not current pricing. Each historical observation is immutable, so do not rerun an observation already published. After expiry plus 300 seconds, use the app's Settlement page and claim controls.

Buying closes before the first historical observation (expiry minus 900 seconds for the mock oracle). Give yourself enough time to buy before that cutoff. The contract requires sufficient lead time and aligned expiries. See `MANUAL_TESTNET.md` for numerical expected payouts and lifecycle acceptance checks.

## 6. Saved files and retries

All generated files are local and Git-ignored under `.testnet-deployment/`:

- `deployment.json`: public account/contract IDs, random salts, WASM hashes, source commit/dirty flag, and progress.
- `cli/`: isolated Stellar CLI configuration and identity references. Key secrets are in macOS Keychain.
- `transactions.log`: command output and deployment transaction diagnostics.
- `env.local.before-*.backup`: backups of the previous frontend environment. These may contain server secrets; keep them private.
- `running.lock`: prevents concurrent deployment/funding operations.

Rerun `--deploy` after a failure. It saves deterministic contract IDs before submitting transactions and checks their on-chain instances before creating anything. Existing matching contracts are reused. Different WASM or constructor configuration causes a stop instead of silently adopting another deployment.

Minting has an additional `pendingMint` journal. If a mint's outcome is uncertain, the script stops rather than blindly sending it again. When the recipient balance confirms the top-up, a retry reconciles the journal. Otherwise inspect the transaction log and network result before manually clearing `pendingMint`; do not clear it while a transaction may still be pending. No automatic repeated mint is assumed safe.

Keep the state and CLI references together with access to their Keychain entries. Do not delete deployment state just to retry: losing it also loses the saved salts and identity mapping. If a completed contract is missing, check for archival or a Testnet reset. For a deliberately new deployment or changed contract source, use a separate project checkout and retain the old deployment's records.

After an interrupted process, a stale lock may remain. Check the PID in `running.lock` and confirm that it has stopped before removing only that lock file. Other deployment files should remain intact.

These managed identities differ from the illustrative `steption-deployer` names in the separate manual runbook. Use the script's printed oracle commands for deployments made by this script.

## Validation performed

- Mac Bash syntax, executable wrapper and dry-run behavior checked.
- Installed CLI 21.2.0 is correctly rejected before state creation.
- Commands checked against the official Stellar CLI 28.0.0 Apple Silicon release in a temporary directory; the installed CLI was not replaced.
- Read-only checks using that CLI confirmed healthy Stellar Testnet, Protocol 28.
- Unit tests cover Testnet network isolation, CLI version gating, current SDK XDR instance/hash handling, exact top-ups, uncertain mint handling, environment preservation, state validation and safely quoted oracle commands.
- All 12 project unit tests, ESLint and TypeScript checks pass.
- Deployment, Keychain identity generation, minting and signed browser flows have not been run against the network. Those remain the acceptance test when you execute `--deploy`.
