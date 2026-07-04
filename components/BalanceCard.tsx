"use client";

interface BalanceCardProps {
  balance: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function BalanceCard({
  balance,
  loading,
  error,
  onRefresh,
}: BalanceCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Testnet XLM Balance
      </span>
      <span className="text-3xl font-semibold tracking-tight">
        {loading ? "..." : balance ? `${balance} XLM` : "—"}
      </span>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="mt-2 text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-950 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {loading ? "Refreshing..." : "Refresh balance"}
      </button>
      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
