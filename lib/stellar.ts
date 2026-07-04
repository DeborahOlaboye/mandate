import { Horizon, Networks, TransactionBuilder, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const server = new Horizon.Server(HORIZON_URL);

export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export async function fetchXlmBalance(address: string): Promise<string> {
  const account = await server.loadAccount(address);
  const xlmBalance = account.balances.find(
    (balance) => balance.asset_type === "native"
  );
  return xlmBalance?.balance ?? "0";
}

export async function fundTestnetAccount(address: string): Promise<void> {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!response.ok) {
    throw new Error("Friendbot funding failed. Try again in a moment.");
  }
}

export async function buildPaymentTransaction(
  sourceAddress: string,
  destination: string,
  amount: string
): Promise<string> {
  const sourceAccount = await server.loadAccount(sourceAddress);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(60)
    .build();

  return transaction.toXDR();
}

export async function submitSignedTransaction(signedXdr: string) {
  const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  return server.submitTransaction(transaction);
}
