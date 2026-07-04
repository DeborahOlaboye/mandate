"use client";

import { useCallback, useState } from "react";
import { getNetworkDetails, signTransaction } from "@stellar/freighter-api";
import { useWallet } from "@/lib/useWallet";
import {
  NETWORK_PASSPHRASE,
  buildPaymentTransaction,
  fetchXlmBalance,
  fundTestnetAccount,
  submitSignedTransaction,
} from "@/lib/stellar";
import WalletConnect from "@/components/WalletConnect";
import BalanceCard from "@/components/BalanceCard";
import SendPaymentForm from "@/components/SendPaymentForm";
import TransactionResult, { TxResult } from "@/components/TransactionResult";

export default function Home() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [needsFunding, setNeedsFunding] = useState(false);

  const [sending, setSending] = useState(false);
  const [txResult, setTxResult] = useState<TxResult | null>(null);

  const refreshBalance = useCallback(
    async (targetAddress?: string) => {
      const target = targetAddress ?? address;
      if (!target) return;
      setBalanceLoading(true);
      setBalanceError(null);
      setNeedsFunding(false);
      try {
        const value = await fetchXlmBalance(target);
        setBalance(value);
      } catch {
        setNeedsFunding(true);
        setBalanceError("Account not found on testnet. Fund it to get started.");
      } finally {
        setBalanceLoading(false);
      }
    },
    [address]
  );

  const handleConnect = useCallback(async () => {
    const connectedAddress = await connect();
    if (connectedAddress) {
      await refreshBalance(connectedAddress);
    }
  }, [connect, refreshBalance]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setBalance(null);
    setBalanceError(null);
    setNeedsFunding(false);
    setTxResult(null);
  }, [disconnect]);

  const handleFund = useCallback(async () => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      await fundTestnetAccount(address);
      await refreshBalance();
    } catch (err) {
      setBalanceError(
        err instanceof Error ? err.message : "Failed to fund account"
      );
    } finally {
      setBalanceLoading(false);
    }
  }, [address, refreshBalance]);

  const handleSend = useCallback(
    async (destination: string, amount: string) => {
      if (!address) return;
      setSending(true);
      setTxResult(null);
      try {
        const network = await getNetworkDetails();
        if (network.networkPassphrase !== NETWORK_PASSPHRASE) {
          throw new Error(
            "Switch Freighter to Test Net before sending a transaction."
          );
        }

        const xdr = await buildPaymentTransaction(address, destination, amount);
        const signed = await signTransaction(xdr, {
          networkPassphrase: NETWORK_PASSPHRASE,
          address,
        });
        if (signed.error) {
          throw new Error(signed.error.message);
        }

        const response = await submitSignedTransaction(signed.signedTxXdr);
        setTxResult({
          status: "success",
          message: "Payment submitted to the Stellar testnet.",
          hash: response.hash,
        });
        await refreshBalance();
      } catch (err) {
        setTxResult({
          status: "error",
          message: err instanceof Error ? err.message : "Transaction failed",
        });
      } finally {
        setSending(false);
      }
    },
    [address, refreshBalance]
  );

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Mandate</h1>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Connect Freighter, check your testnet balance, and send an XLM
            payment on the Stellar testnet.
          </p>
        </div>

        <WalletConnect
          address={address}
          connecting={connecting}
          error={error}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        {address && (
          <>
            <BalanceCard
              balance={balance}
              loading={balanceLoading}
              error={balanceError}
              onRefresh={refreshBalance}
            />

            {needsFunding && (
              <button
                onClick={handleFund}
                disabled={balanceLoading}
                className="rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
              >
                Fund with Friendbot
              </button>
            )}

            <SendPaymentForm
              disabled={!address}
              sending={sending}
              onSend={handleSend}
            />

            {txResult && <TransactionResult result={txResult} />}
          </>
        )}
      </main>
    </div>
  );
}
