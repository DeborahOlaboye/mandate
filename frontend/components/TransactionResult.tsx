"use client";

export interface TxResult {
  status: "success" | "error";
  message: string;
  hash?: string;
}

export default function TransactionResult({ result }: { result: TxResult }) {
  const isSuccess = result.status === "success";

  return (
    <div
      className={`w-full max-w-sm rounded-2xl border p-4 text-sm ${
        isSuccess
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      }`}
    >
      <p className="font-medium">
        {isSuccess ? "Transaction successful" : "Transaction failed"}
      </p>
      <p className="mt-1 break-words">{result.message}</p>
      {result.hash && (
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block break-all underline underline-offset-4"
        >
          View on Stellar Expert: {result.hash}
        </a>
      )}
    </div>
  );
}
