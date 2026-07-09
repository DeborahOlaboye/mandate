import { contract, rpc, scValToNative } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";

export const MANDATE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_MANDATE_CONTRACT_ID ||
  "CB4NDEGLS5SS6N5Q4ZPVE7KBI5Y4P4JMJ7NEA7LHD4GHXBC7XMUUYPKU";

export const NATIVE_ASSET_CONTRACT_ID =
  process.env.NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID ||
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

export const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);

export interface Mandate {
  owner: string;
  spender: string;
  asset: string;
  limit: bigint;
  spent: bigint;
  expiration_ledger: number;
  revoked: boolean;
}

/**
 * The generic contract.Client builds its methods dynamically from the
 * on-chain spec, so TypeScript can't infer them. This interface describes
 * the shape we know the deployed mandate contract exposes.
 */
export interface MandateClient extends contract.Client {
  create_mandate(args: {
    owner: string;
    spender: string;
    asset: string;
    limit: bigint;
    expiration_ledger: number;
  }): Promise<contract.AssembledTransaction<contract.Result<bigint>>>;

  spend(args: {
    mandate_id: bigint;
    amount: bigint;
    destination: string;
  }): Promise<contract.AssembledTransaction<contract.Result<void>>>;

  revoke(args: {
    mandate_id: bigint;
  }): Promise<contract.AssembledTransaction<contract.Result<void>>>;

  get_mandate(args: {
    mandate_id: bigint;
  }): Promise<contract.AssembledTransaction<contract.Result<Mandate>>>;
}

export async function getMandateClient(options: {
  publicKey?: string;
  signTransaction?: contract.ClientOptions["signTransaction"];
}): Promise<MandateClient> {
  const client = await contract.Client.from({
    contractId: MANDATE_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: SOROBAN_RPC_URL,
    publicKey: options.publicKey,
    signTransaction: options.signTransaction,
  });
  return client as MandateClient;
}

export interface MandateActionResult {
  status: "success" | "error";
  message: string;
  hash?: string;
  value?: unknown;
}

function isResultLike(value: unknown): value is contract.Result<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    "isErr" in value &&
    typeof (value as contract.Result<unknown>).isErr === "function"
  );
}

/**
 * Runs any contract write call, signs and sends it, and normalizes every
 * failure path into a single result shape:
 * - thrown errors (wallet rejection, network/simulation failure)
 * - contract-level `Result::Err` values (e.g. mandate limit exceeded), for
 *   contracts that return `Result<T, Error>` rather than panicking
 */
export async function runContractWrite<T>(
  build: () => Promise<contract.AssembledTransaction<T>>,
  onPending: (hash: string | undefined) => void
): Promise<MandateActionResult> {
  try {
    const tx = await build();
    const sent = await tx.signAndSend({
      watcher: {
        onSubmitted: (response?: rpc.Api.SendTransactionResponse) => onPending(response?.hash),
        onProgress: () => {},
      } as unknown as contract.Watcher,
    });

    const hash = sent.sendTransactionResponse?.hash;
    const result: unknown = sent.result;

    if (isResultLike(result) && result.isErr()) {
      return { status: "error", message: result.unwrapErr().message, hash };
    }

    const value = isResultLike(result) ? result.unwrap() : undefined;
    return { status: "success", message: "Confirmed on the Stellar testnet.", hash, value };
  } catch (err) {
    if (err instanceof contract.AssembledTransaction.Errors.UserRejected) {
      return { status: "error", message: "Transaction was rejected in your wallet." };
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Transaction failed",
    };
  }
}

export interface MandateEvent {
  id: string;
  ledger: number;
  txHash: string;
  name: string;
  mandateId?: number;
  data: unknown;
}

function parseEvent(event: rpc.Api.EventResponse): MandateEvent {
  const topics = event.topic.map((t) => scValToNative(t));
  const name = typeof topics[0] === "string" ? topics[0] : "event";
  const mandateIdRaw = topics[1];
  const mandateId =
    typeof mandateIdRaw === "bigint" || typeof mandateIdRaw === "number"
      ? Number(mandateIdRaw)
      : undefined;

  return {
    id: event.id,
    ledger: event.ledger,
    txHash: event.txHash,
    name,
    mandateId,
    data: scValToNative(event.value),
  };
}

export async function fetchMandateEvents(
  cursorOrStartLedger: { cursor: string } | { startLedger: number }
): Promise<{ events: MandateEvent[]; cursor: string }> {
  const response = await sorobanServer.getEvents({
    filters: [{ type: "contract", contractIds: [MANDATE_CONTRACT_ID] }],
    limit: 50,
    ...cursorOrStartLedger,
  });

  return { events: response.events.map(parseEvent), cursor: response.cursor };
}

export async function getLatestLedgerSequence(): Promise<number> {
  const { sequence } = await sorobanServer.getLatestLedger();
  return sequence;
}
