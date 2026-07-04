"use client";

export interface TxResult {
  status: "pending" | "success" | "error";
  message: string;
  hash?: string;
}

const STYLES: Record<TxResult["status"], { classes: string; label: string }> = {
  pending: {
    classes:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    label: "Transaction pending",
  },
  success: {
    classes:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    label: "Transaction successful",
  },
  error: {
    classes:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    label: "Transaction failed",
  },
};

export default function TransactionResult({ result }: { result: TxResult }) {
  const { classes, label } = STYLES[result.status];

  return (
    <div className={`w-full max-w-sm rounded-2xl border p-4 text-sm ${classes}`}>
      <p className="font-medium">{label}</p>
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
