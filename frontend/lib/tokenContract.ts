import { Address, Contract, contract, nativeToScVal } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";
import { NATIVE_ASSET_CONTRACT_ID, SOROBAN_RPC_URL } from "@/lib/mandateContract";

/**
 * The native XLM asset contract (and other Stellar Asset Contracts) are
 * built-in host contracts with no uploaded WASM binary, so
 * `contract.Client.from()` can't auto-discover their spec (it reads the spec
 * out of the WASM). Instead we build the SEP-41 `approve` call by hand —
 * `Contract.call()` only needs the raw ScVal args, no spec required — and
 * hand the resulting operation to `AssembledTransaction.buildWithOp` so it
 * still goes through the normal simulate/sign/send lifecycle.
 */
export async function buildApproveTransaction(options: {
  contractId?: string;
  from: string;
  spender: string;
  amount: bigint;
  expirationLedger: number;
  publicKey: string;
  signTransaction: contract.SignTransaction;
}): Promise<contract.AssembledTransaction<void>> {
  const tokenContractId = options.contractId ?? NATIVE_ASSET_CONTRACT_ID;
  const tokenContract = new Contract(tokenContractId);

  const operation = tokenContract.call(
    "approve",
    new Address(options.from).toScVal(),
    new Address(options.spender).toScVal(),
    nativeToScVal(options.amount, { type: "i128" }),
    nativeToScVal(options.expirationLedger, { type: "u32" })
  );

  return contract.AssembledTransaction.buildWithOp(operation, {
    method: "approve",
    contractId: tokenContractId,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: SOROBAN_RPC_URL,
    publicKey: options.publicKey,
    signTransaction: options.signTransaction,
    parseResultXdr: () => undefined,
  });
}
