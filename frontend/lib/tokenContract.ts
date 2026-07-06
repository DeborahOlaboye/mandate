import { contract } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";
import { NATIVE_ASSET_CONTRACT_ID, SOROBAN_RPC_URL } from "@/lib/mandateContract";

/**
 * Minimal SEP-41 token client interface for the calls this app needs.
 * The native XLM Stellar Asset Contract implements this interface, so
 * owners can approve the Mandate contract as an allowed spender.
 */
export interface TokenClient extends contract.Client {
  approve(args: {
    from: string;
    spender: string;
    amount: bigint;
    expiration_ledger: number;
  }): Promise<contract.AssembledTransaction<void>>;

  allowance(args: { from: string; spender: string }): Promise<
    contract.AssembledTransaction<bigint>
  >;

  balance(args: { id: string }): Promise<contract.AssembledTransaction<bigint>>;
}

export async function getTokenClient(options: {
  contractId?: string;
  publicKey?: string;
  signTransaction?: contract.ClientOptions["signTransaction"];
}): Promise<TokenClient> {
  const client = await contract.Client.from({
    contractId: options.contractId ?? NATIVE_ASSET_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: SOROBAN_RPC_URL,
    publicKey: options.publicKey,
    signTransaction: options.signTransaction,
  });
  return client as TokenClient;
}
