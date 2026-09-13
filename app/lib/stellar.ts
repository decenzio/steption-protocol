import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import type { Config, Position, Series, TransactionProgress } from "./types";

export const mode = process.env.NEXT_PUBLIC_APP_MODE ?? "preview";
export const isPreview = mode === "preview";
export const contractId = process.env.NEXT_PUBLIC_OPTIONS_CONTRACT_ID ?? "";
const endpoint =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const configured =
  mode === "testnet" && StrKey.isValidContract(contractId);
export function configurationError() {
  if (!["preview", "testnet"].includes(mode))
    return "APP_MODE must be preview or testnet.";
  if (!isPreview && !configured)
    return "Add the deployed Testnet contract ID to .env.local and restart the app.";
  return "";
}
function server() {
  return new rpc.Server(endpoint);
}
export async function networkInfo() {
  const info = await server().getNetwork();
  if (info.passphrase !== Networks.TESTNET)
    throw new Error("RPC is not Stellar Testnet. Transactions are blocked.");
  return info;
}
export async function connectWallet() {
  const installed = await isConnected();
  if (installed.error || !installed.isConnected)
    throw new Error(
      "Install the Freighter browser extension, then connect here.",
    );
  const access = await requestAccess();
  if (access.error || !access.address)
    throw new Error(access.error?.message || "Wallet connection was declined.");
  await verifyWallet(access.address);
  return access.address;
}
export async function verifyWallet(expected?: string) {
  const [network, account] = await Promise.all([getNetwork(), getAddress()]);
  if (network.error || network.networkPassphrase !== Networks.TESTNET)
    throw new Error("Switch Freighter to Stellar Testnet.");
  if (
    account.error ||
    !account.address ||
    (expected && account.address !== expected)
  )
    throw new Error("Wallet account changed. Reconnect before continuing.");
  return account.address;
}
const i128 = (value: bigint) => nativeToScVal(value, { type: "i128" });
const u64 = (value: bigint) => nativeToScVal(value, { type: "u64" });
const address = (value: string) => new Address(value).toScVal();
type Arg = ReturnType<typeof nativeToScVal>;
function operation(method: string, args: Arg[]) {
  if (!configured)
    throw new Error(
      configurationError() || "Transactions are unavailable in preview mode.",
    );
  return new Contract(contractId).call(method, ...args);
}
// Fixed public zero account is only a simulation source; no private key exists in this app.
const simulationSource = StrKey.encodeEd25519PublicKey(new Uint8Array(32));
export async function read<T>(method: string, args: Arg[] = []): Promise<T> {
  const tx = new TransactionBuilder(new Account(simulationSource, "0"), {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation(method, args))
    .setTimeout(60)
    .build();
  const result = await server().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(result.error);
  if (!rpc.Api.isSimulationSuccess(result) || !result.result)
    throw new Error("Contract read returned no result.");
  return scValToNative(result.result.retval) as T;
}
export async function loadSeries(ids: bigint[]) {
  const result: Series[] = [];
  for (let i = 0; i < ids.length; i += 8)
    result.push(
      ...(await Promise.all(
        ids.slice(i, i + 8).map((id) => read<Series>("get_series", [u64(id)])),
      )),
    );
  return result;
}
export async function loadMarkets(before?: bigint) {
  await networkInfo();
  const [count, config] = await Promise.all([
    read<bigint>("series_count"),
    read<Config>("get_config"),
  ]);
  const end = before !== undefined && before < count ? before : count;
  const start = end > 63n ? end - 63n : 1n;
  const ids = Array.from(
    { length: Number(end >= start ? end - start + 1n : 0n) },
    (_, i) => start + BigInt(i),
  );
  return {
    series: await loadSeries(ids),
    config,
    next: start > 1n ? start - 1n : 0n,
  };
}
export async function loadWritten(owner: string) {
  return loadSeries(await read<bigint[]>("written_by", [address(owner)]));
}
export async function loadPositions(owner: string) {
  const ids = await read<bigint[]>("positions_of", [address(owner)]);
  const positions: Position[] = [];
  for (let i = 0; i < ids.length; i += 8)
    positions.push(
      ...(await Promise.all(
        ids
          .slice(i, i + 8)
          .map((id) => read<Position>("get_position", [u64(id)])),
      )),
    );
  return positions;
}
async function send(
  owner: string,
  method: string,
  args: Arg[],
  progress: TransactionProgress,
) {
  await Promise.all([networkInfo(), verifyWallet(owner)]);
  const client = server();
  progress("Simulating transaction…");
  const account = await client.getAccount(owner);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation(method, args))
    .setTimeout(180)
    .build();
  const prepared = await client.prepareTransaction(tx);
  progress("Confirm in Freighter…");
  await verifyWallet(owner);
  const signed = await signTransaction(prepared.toXdr(), {
    networkPassphrase: Networks.TESTNET,
    address: owner,
  });
  if (signed.error || !signed.signedTxXdr)
    throw new Error(signed.error?.message || "Signature was declined.");
  if (signed.signerAddress && signed.signerAddress !== owner)
    throw new Error("Unexpected signing account.");
  const transaction = TransactionBuilder.fromXdr(
    signed.signedTxXdr,
    Networks.TESTNET,
  );
  if (transaction.hash().some((byte, i) => byte !== prepared.hash()[i]))
    throw new Error("Wallet returned a different transaction.");
  progress("Submitting to Testnet…");
  const submitted = await client.sendTransaction(transaction);
  if (!["PENDING", "DUPLICATE"].includes(submitted.status))
    throw new Error(
      `Submission ${submitted.status}. Refresh before trying again.`,
    );
  progress("Awaiting ledger confirmation…", submitted.hash);
  for (let attempt = 0; attempt < 45; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = await client.getTransaction(submitted.hash);
    if (result.status === "SUCCESS") {
      progress("Confirmed on Stellar Testnet", submitted.hash);
      return submitted.hash;
    }
    if (result.status === "FAILED")
      throw new Error(`Transaction failed on-chain: ${submitted.hash}`);
  }
  throw new Error(
    `Confirmation is still pending. Check ${submitted.hash} before submitting again.`,
  );
}
export function buy(
  owner: string,
  series: Series,
  quantity: bigint,
  progress: TransactionProgress,
) {
  return send(
    owner,
    "buy",
    [
      u64(series.id),
      address(owner),
      u64(quantity),
      i128(series.premium * quantity),
      u64(BigInt(Math.floor(Date.now() / 1000) + 180)),
    ],
    progress,
  );
}
export function createSeries(
  owner: string,
  terms: {
    isCall: boolean;
    strike: bigint;
    cap: bigint;
    expiry: bigint;
    premium: bigint;
    capacity: bigint;
  },
  progress: TransactionProgress,
) {
  return send(
    owner,
    "create_series",
    [
      address(owner),
      nativeToScVal(terms.isCall),
      i128(terms.strike),
      i128(terms.cap),
      u64(terms.expiry),
      i128(terms.premium),
      u64(terms.capacity),
    ],
    progress,
  );
}
export function settle(
  owner: string,
  id: bigint,
  progress: TransactionProgress,
) {
  return send(owner, "settle", [u64(id)], progress);
}
export function claim(
  owner: string,
  id: bigint,
  progress: TransactionProgress,
) {
  return send(owner, "claim", [u64(id)], progress);
}
export function claimWriter(
  owner: string,
  id: bigint,
  progress: TransactionProgress,
) {
  return send(owner, "claim_writer", [u64(id)], progress);
}
export function cancelInventory(
  owner: string,
  id: bigint,
  quantity: bigint,
  progress: TransactionProgress,
) {
  return send(owner, "cancel_inventory", [u64(id), u64(quantity)], progress);
}
