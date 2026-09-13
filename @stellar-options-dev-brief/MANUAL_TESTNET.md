# Manual Stellar Testnet deployment

These steps are for you to run later. They have **not** been executed against the chain. Frontend hosting and contract deployment are separate: the contracts run on Stellar, while the Next.js app runs locally or on a Node-compatible web host.

## 1. Toolchain and local verification

Use Node 22.12+, Rust 1.91.0 and Stellar CLI 28.0.0. The repository pins Rust and adds `wasm32v1-none`. Your previously installed CLI 21.2.0 needs upgrading. Use Stellar's [official CLI installation guide](https://developers.stellar.org/docs/tools/cli/install-cli).

```sh
rustup toolchain install 1.91.0 --profile minimal --target wasm32v1-none
cargo install --locked stellar-cli --version 28.0.0
npm ci
npm run typecheck
npm run lint
npm test
npm run build
cargo test --workspace --locked
cargo build --target wasm32v1-none --release --locked
npm run testnet:check
```

WASM files are `target/wasm32v1-none/release/steption_options.wasm` and `steption_mock_oracle.wasm`. The completed package also includes copies in `artifacts/`, with SHA-256 hashes. Rebuild after any contract change; use your freshly built files.

## 2. Choose collateral and oracle

For the first deterministic test, use a custom Testnet USDC asset and the included mock oracle. This asset has no real value and is **not Circle-issued USDC**. The mock prices are manually controlled test inputs, not market data.

For a real-feed test, independently verify a supported oracle and the exact Testnet USDC issuer/SAC. The options constructor needs a SEP-40 USD base, `Other("XLM")`, `Other("USDC")`, and matching feed decimals. Do not paste Mainnet addresses. The documented Reflector external Testnet candidate is `CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63`, but this release has not verified that candidate's live metadata or price history. Run the preflight with `ORACLE_ID` and `COLLATERAL_TOKEN_ID` before deployment. Oracle history retention and publication semantics must cover the chosen settlement windows.

## 3. Create isolated test identities and a test asset

These commands generate fresh Testnet keys. Do not reuse production keys or export secrets into `.env.local`.

```sh
stellar keys generate steption-deployer --network testnet --fund
stellar keys generate steption-writer --network testnet --fund
stellar keys generate steption-buyer --network testnet --fund

STEPTION_ADMIN=$(stellar keys address steption-deployer)
STEPTION_WRITER=$(stellar keys address steption-writer)
STEPTION_BUYER=$(stellar keys address steption-buyer)

stellar contract asset deploy --asset "USDC:$STEPTION_ADMIN" \
  --source-account steption-deployer --network testnet
```

Record the printed SAC contract ID as `STEPTION_TOKEN`. Set it explicitly to the returned C-address:

```sh
STEPTION_TOKEN='C_REPLACE_WITH_RETURNED_TOKEN_ID'

stellar tx new change-trust --source-account steption-writer \
  --network testnet --line "USDC:$STEPTION_ADMIN"
stellar tx new change-trust --source-account steption-buyer \
  --network testnet --line "USDC:$STEPTION_ADMIN"

stellar contract invoke --id "$STEPTION_TOKEN" \
  --source-account steption-deployer --network testnet -- mint \
  --to "$STEPTION_WRITER" --amount 10000000000
stellar contract invoke --id "$STEPTION_TOKEN" \
  --source-account steption-deployer --network testnet -- mint \
  --to "$STEPTION_BUYER" --amount 10000000000
```

The amounts above are token atoms: 10,000,000,000 atoms = 1,000 test USDC. The issuer's default token controls should remain unchanged. With an external USDC issuer, you cannot call `mint`; use its official Testnet faucet and its required trustline instead.

## 4. Deploy the mock oracle and options contract

```sh
stellar contract deploy \
  --wasm target/wasm32v1-none/release/steption_mock_oracle.wasm \
  --source-account steption-deployer --network testnet \
  --alias steption-oracle -- --admin "$STEPTION_ADMIN"
```

Record its returned address, then deploy the options contract:

```sh
STEPTION_ORACLE='C_REPLACE_WITH_RETURNED_ORACLE_ID'

ORACLE_ID="$STEPTION_ORACLE" COLLATERAL_TOKEN_ID="$STEPTION_TOKEN" \
  npm run testnet:check

stellar contract deploy \
  --wasm target/wasm32v1-none/release/steption_options.wasm \
  --source-account steption-deployer --network testnet \
  --alias steption-options -- --admin "$STEPTION_ADMIN" \
  --collateral_token "$STEPTION_TOKEN" --oracle "$STEPTION_ORACLE"

STEPTION_OPTIONS='C_REPLACE_WITH_RETURNED_OPTIONS_ID'
```

Record network, addresses, issuer, source commit, WASM checksums, deployment transactions and oracle type. The constructor fixes the token/oracle configuration; this contract has no admin upgrade or price-override function.

## 5. Enable the app

```sh
cp .env.example .env.local
```

Edit the file:

```dotenv
NEXT_PUBLIC_APP_MODE=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_OPTIONS_CONTRACT_ID=C_REPLACE_WITH_RETURNED_OPTIONS_ID
```

Then:

```sh
npm run testnet:check
npm run dev
```

Switch Freighter to Testnet and connect a funded test wallet. For an existing Freighter wallet, add the same issued USDC trustline through Freighter or Stellar Lab, then mint test tokens to its public address from `steption-deployer`. Do not expose a secret key to the browser or this app. You may keep the CLI identities separate and use them for the deterministic smoke test below.

Changing `NEXT_PUBLIC_*` values requires restarting development, or rebuilding a production bundle.

## 6. Deterministic contract lifecycle smoke test

Choose an expiry at least 30 minutes ahead and aligned to 300 seconds. This prints a suitable Unix value without submitting anything:

```sh
node -e 'console.log((Math.floor(Date.now()/1000/300)+7)*300)'
```

Assign the printed number to `STEPTION_EXPIRY`. Example commands below use **raw atoms**, while the app accepts ordinary decimal USDC amounts.

```sh
STEPTION_EXPIRY=REPLACE_WITH_PRINTED_INTEGER

stellar contract invoke --id "$STEPTION_OPTIONS" \
  --source-account steption-writer --network testnet -- create_series \
  --writer "$STEPTION_WRITER" --is_call false --strike 2000000 --cap 0 \
  --expiry "$STEPTION_EXPIRY" --premium 100000 --capacity 100
```

Record the returned series ID (1 for a fresh contract). This reserves 20 test USDC for 100 put lots at a 0.20 strike. Compute a transaction deadline:

```sh
node -e 'console.log(Math.floor(Date.now()/1000)+180)'
```

Set `STEPTION_DEADLINE` to the result and buy before expiry minus 900 seconds:

```sh
STEPTION_SERIES=1
STEPTION_DEADLINE=REPLACE_WITH_PRINTED_INTEGER

stellar contract invoke --id "$STEPTION_OPTIONS" \
  --source-account steption-buyer --network testnet -- buy \
  --series_id "$STEPTION_SERIES" --buyer "$STEPTION_BUYER" \
  --quantity 40 --max_premium 4000000 --deadline "$STEPTION_DEADLINE"
```

Record the returned position ID. Forty lots cost 0.4 USDC. The following helper **only prints commands** for the six fixed mock observations. After expiry, run the printed commands yourself:

```sh
node scripts/fixture-observations.mjs "$STEPTION_ORACLE" "$STEPTION_EXPIRY" 1000000 10000000
```

That models XLM = 0.10 USD and USDC = 1 USD. Wait until expiry plus 300 seconds, then:

```sh
stellar contract invoke --id "$STEPTION_OPTIONS" \
  --source-account steption-deployer --network testnet -- settle \
  --series_id "$STEPTION_SERIES"

stellar contract invoke --id "$STEPTION_OPTIONS" \
  --source-account steption-buyer --network testnet -- claim --position_id 1

stellar contract invoke --id "$STEPTION_OPTIONS" \
  --source-account steption-writer --network testnet -- claim_writer \
  --series_id "$STEPTION_SERIES"
```

Expected: buyer receives 4 USDC; writer recovers 16 USDC of collateral and keeps the 0.4 premium. The series has zero remaining reserve. A repeated claim must fail. Read via `get_series --id 1` and `get_position --id 1` to confirm. Repeat with a capped call, spot above the cap, writer-first claim order and cancelled unsold inventory.

## 7. Browser acceptance and operation

After deployment, manually verify: wallet rejection; wrong network; wrong account; insufficient balance; search/filter/sort; exact seven-decimal terms and UTC expiry; buy review and wallet signature; confirmation link; portfolio reload; inventory cancellation; settlement before/after eligibility; one-time buyer/writer claims. Check mobile width and keyboard dialog behavior. These live signed flows were intentionally not executed during preparation.

Run settlement promptly. If required historical observations are unavailable, it stays pending. The contract cannot substitute current spot or accept a discretionary admin price. Persistent positions can be restored through RPC simulation, but provider history may have separate retention. Before production, design and audit the missing-history recovery policy and operator monitoring.

Testnet resets erase identities, balances and contract state. Keep this runbook and repeat deployment when needed. Confirm the latest reset schedule in [Stellar network documentation](https://developers.stellar.org/docs/networks).

## 8. Optional frontend hosting and newsletter

Use a Node-compatible host with the existing repository root as its project root, build command `npm run build`, and start command `npm start`. Set the public Testnet variables before building. No frontend has been published in this work.

The supplied start command uses `scripts/server.mjs` to preserve HTML/Markdown content-negotiation headers. Use `npm start -- --hostname 0.0.0.0` when a container host requires binding to all interfaces; it respects the host's `PORT`. Native serverless Next hosting that bypasses this command needs an equivalent final-response `Vary: Accept` rule at its gateway. See `SEO_GEO.md` for the complete SEO configuration and acceptance checks.

Newsletter integration needs server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and a `newsletter_subscribers` table with a unique email column. Without them the endpoint returns an honest unavailable message. Add gateway rate limiting before enabling public signup. Never prefix a service-role key with `NEXT_PUBLIC_`.

CLI syntax reference: [official Stellar CLI manual](https://developers.stellar.org/docs/tools/cli/stellar-cli). The installed old CLI cannot validate these current commands; use the specified updated CLI when you run this guide.
