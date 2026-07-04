"use client";

import { useCallback, useState } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const connectedCheck = await isConnected();
      if (connectedCheck.error) {
        throw new Error(connectedCheck.error.message);
      }
      if (!connectedCheck.isConnected) {
        throw new Error("Freighter is not installed. Install it from freighter.app.");
      }

      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message);
      }

      setAddress(access.publicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return { address, connecting, error, connect, disconnect };
}
