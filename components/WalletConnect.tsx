"use client";

function truncate(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface WalletConnectProps {
  address: string | null;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletConnect({
  address,
  connecting,
  error,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      {address ? (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            Connected: {truncate(address)}
          </span>
          <button
            onClick={onDisconnect}
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {connecting ? "Connecting..." : "Connect Freighter Wallet"}
        </button>
      )}
      {error && (
        <p className="max-w-sm text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
