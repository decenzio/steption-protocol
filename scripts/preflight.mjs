import {
  Account,
  BASE_FEE,
  Contract,
  Networks,
  StrKey,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
const url =
  process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
const server = new rpc.Server(url);
const json = (value) =>
  JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
async function read(id, method) {
  if (!StrKey.isValidContract(id))
    throw new Error("Invalid contract ID for " + method);
  const tx = new TransactionBuilder(
    new Account(StrKey.encodeEd25519PublicKey(new Uint8Array(32)), "0"),
    { fee: BASE_FEE, networkPassphrase: Networks.TESTNET },
  )
    .addOperation(new Contract(id).call(method))
    .setTimeout(60)
    .build();
  const result = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result))
    throw new Error(`${method}: ${result.error}`);
  if (!rpc.Api.isSimulationSuccess(result) || !result.result)
    throw new Error(`${method}: no result`);
  return scValToNative(result.result.retval);
}
try {
  const [network, health] = await Promise.all([
    server.getNetwork(),
    server.getHealth(),
  ]);
  if (network.passphrase !== Networks.TESTNET)
    throw new Error("Refusing non-Testnet RPC.");
  console.log("Read-only Stellar Testnet preflight");
  console.log(json({ network, health }));
  const id = process.env.NEXT_PUBLIC_OPTIONS_CONTRACT_ID;
  let oracle = process.env.ORACLE_ID,
    token = process.env.COLLATERAL_TOKEN_ID;
  if (id) {
    const config = await read(id, "get_config");
    console.log("Options configuration", json(config));
    oracle = config.oracle;
    token = config.token;
    console.log("Series count", String(await read(id, "series_count")));
  }
  if (oracle) {
    const [base, assets, decimals, resolution] = await Promise.all(
      ["base", "assets", "decimals", "resolution"].map((method) =>
        read(oracle, method),
      ),
    );
    console.log(
      "Oracle metadata",
      json({ id: oracle, base, assets, decimals, resolution }),
    );
    const other = (asset) =>
      Array.isArray(asset) && asset[0] === "Other" ? asset[1] : undefined;
    if (
      other(base) !== "USD" ||
      !assets.some((a) => other(a) === "XLM") ||
      !assets.some((a) => other(a) === "USDC")
    )
      throw new Error(
        "Oracle must provide XLM/USD and USDC/USD using SEP-40 Other symbols.",
      );
    if (decimals > 18 || Number(resolution) <= 0 || Number(resolution) > 86400)
      throw new Error("Unsupported oracle precision or resolution.");
  }
  if (token) {
    const [decimals, name, symbol] = await Promise.all(
      ["decimals", "name", "symbol"].map((method) => read(token, method)),
    );
    console.log(
      "Collateral token",
      json({ id: token, decimals, name, symbol }),
    );
    if (decimals !== 7) throw new Error("Collateral must use 7 decimals.");
  }
  if (!id)
    console.log(
      "No options contract configured. Network checks passed; deploy manually, then set NEXT_PUBLIC_OPTIONS_CONTRACT_ID.",
    );
  console.log("No keys created and no transactions submitted.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
