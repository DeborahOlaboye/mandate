"use client";

import { useCallback, useState } from "react";
import { connectWallet, disconnectWallet } from "@/lib/walletKit";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (): Promise<string | null> => {
    setError(null);
    setConnecting(true);
    try {
      const connectedAddress = await connectWallet();
      setAddress(connectedAddress);
      return connectedAddress;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch {
      // Wallet may not support/require an explicit disconnect call.
    }
    setAddress(null);
    setError(null);
  }, []);

  return { address, connecting, error, connect, disconnect };
}
