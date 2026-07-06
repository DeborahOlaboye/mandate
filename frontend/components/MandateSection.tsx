"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLatestLedgerSequence,
  getMandateClient,
  Mandate,
  MandateClient,
  MANDATE_CONTRACT_ID,
  NATIVE_ASSET_CONTRACT_ID,
  runContractWrite,
} from "@/lib/mandateContract";
import { getTokenClient } from "@/lib/tokenContract";
import { getSignTransaction } from "@/lib/walletKit";
import { useMandateEvents } from "@/lib/useMandateEvents";
import EventFeed from "@/components/EventFeed";
import TransactionResult, { TxResult } from "@/components/TransactionResult";

function formatMandate(mandate: Mandate): string {
  return [
    `owner: ${mandate.owner}`,
    `spender: ${mandate.spender}`,
    `asset: ${mandate.asset}`,
    `limit: ${mandate.limit}`,
    `spent: ${mandate.spent}`,
    `expires at ledger: ${mandate.expiration_ledger}`,
    `revoked: ${mandate.revoked}`,
  ].join("\n");
}

export default function MandateSection({ address }: { address: string }) {
  const [client, setClient] = useState<MandateClient | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [signTransaction, setSignTransaction] = useState<
    Awaited<ReturnType<typeof getSignTransaction>> | null
  >(null);

  const [approveAmount, setApproveAmount] = useState("1000");
  const [approveValidForLedgers, setApproveValidForLedgers] = useState("100000");
  const [approving, setApproving] = useState(false);
  const [approveResult, setApproveResult] = useState<TxResult | null>(null);

  const [spender, setSpender] = useState("");
  const [limit, setLimit] = useState("1000");
  const [validForLedgers, setValidForLedgers] = useState("100000");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<TxResult | null>(null);

  const [spendMandateId, setSpendMandateId] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [spendDestination, setSpendDestination] = useState("");
  const [spending, setSpending] = useState(false);
  const [spendResult, setSpendResult] = useState<TxResult | null>(null);

  const [revokeMandateId, setRevokeMandateId] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeResult, setRevokeResult] = useState<TxResult | null>(null);

  const [lookupMandateId, setLookupMandateId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const events = useMandateEvents(!!client);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      setClient(null);
      setClientError(null);
      try {
        const sign = await getSignTransaction();
        const mandateClient = await getMandateClient({ publicKey: address, signTransaction: sign });
        if (!cancelled) {
          setSignTransaction(() => sign);
          setClient(mandateClient);
        }
      } catch (err) {
        if (!cancelled) {
          setClientError(
            err instanceof Error ? err.message : "Failed to load the mandate contract"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const handleApprove = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!signTransaction) return;
      setApproving(true);
      setApproveResult(null);
      const result = await runContractWrite(
        async () => {
          const tokenClient = await getTokenClient({ publicKey: address, signTransaction });
          const currentLedger = await getLatestLedgerSequence();
          return tokenClient.approve({
            from: address,
            spender: MANDATE_CONTRACT_ID,
            amount: BigInt(approveAmount),
            expiration_ledger: currentLedger + Number(approveValidForLedgers),
          });
        },
        (hash) => setApproveResult({ status: "pending", message: "Submitted, awaiting confirmation...", hash })
      );
      setApproveResult(result);
      setApproving(false);
    },
    [address, signTransaction, approveAmount, approveValidForLedgers]
  );

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;
      setCreating(true);
      setCreateResult(null);
      const result = await runContractWrite(
        async () => {
          const currentLedger = await getLatestLedgerSequence();
          return client.create_mandate({
            owner: address,
            spender,
            asset: NATIVE_ASSET_CONTRACT_ID,
            limit: BigInt(limit),
            expiration_ledger: currentLedger + Number(validForLedgers),
          });
        },
        (hash) => setCreateResult({ status: "pending", message: "Submitted, awaiting confirmation...", hash })
      );
      setCreateResult(result);
      setCreating(false);
    },
    [client, address, spender, limit, validForLedgers]
  );

  const handleSpend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;
      setSpending(true);
      setSpendResult(null);
      const result = await runContractWrite(
        () =>
          client.spend({
            mandate_id: BigInt(spendMandateId),
            amount: BigInt(spendAmount),
            destination: spendDestination,
          }),
        (hash) => setSpendResult({ status: "pending", message: "Submitted, awaiting confirmation...", hash })
      );
      setSpendResult(result);
      setSpending(false);
    },
    [client, spendMandateId, spendAmount, spendDestination]
  );

  const handleRevoke = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;
      setRevoking(true);
      setRevokeResult(null);
      const result = await runContractWrite(
        () => client.revoke({ mandate_id: BigInt(revokeMandateId) }),
        (hash) => setRevokeResult({ status: "pending", message: "Submitted, awaiting confirmation...", hash })
      );
      setRevokeResult(result);
      setRevoking(false);
    },
    [client, revokeMandateId]
  );

  const handleLookup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;
      setLookupLoading(true);
      setLookupResult(null);
      setLookupError(null);
      try {
        const tx = await client.get_mandate({ mandate_id: BigInt(lookupMandateId) });
        if (tx.result.isErr()) {
          setLookupError(tx.result.unwrapErr().message);
        } else {
          setLookupResult(formatMandate(tx.result.unwrap()));
        }
      } catch (err) {
        setLookupError(err instanceof Error ? err.message : "Lookup failed");
      } finally {
        setLookupLoading(false);
      }
    },
    [client, lookupMandateId]
  );

  return (
    <div className="flex w-full flex-col items-center gap-6 border-t border-black/[.08] pt-8 dark:border-white/[.145]">
      <div className="flex flex-col items-center gap-1 px-4 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Mandates (Soroban)</h2>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Mandates move real testnet XLM: approve the contract as a token
          spender, create a mandate, then spend against it — each spend calls
          the native asset contract to move funds from the owner to the
          destination.
        </p>
      </div>

      {clientError && (
        <p className="max-w-sm px-4 text-center text-sm text-red-600 dark:text-red-400">
          {clientError}
        </p>
      )}

      {!client && !clientError && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading contract client…</p>
      )}

      {client && (
        <>
          <form
            onSubmit={handleApprove}
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
          >
            <span className="text-sm font-medium">1. Approve token allowance</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Authorizes the Mandate contract to move up to this much XLM from
              your account. Do this once before creating a mandate with a
              matching or lower limit.
            </p>
            <label className="flex flex-col gap-1 text-sm">
              Amount (stroops)
              <input
                type="number"
                min="1"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valid for (ledgers from now)
              <input
                type="number"
                min="1"
                value={approveValidForLedgers}
                onChange={(e) => setApproveValidForLedgers(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <button
              type="submit"
              disabled={approving}
              className="mt-1 rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              {approving ? "Approving..." : "Approve allowance"}
            </button>
            {approveResult && <TransactionResult result={approveResult} />}
          </form>

          <form
            onSubmit={handleCreate}
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
          >
            <span className="text-sm font-medium">2. Create mandate</span>
            <label className="flex flex-col gap-1 text-sm">
              Spender address
              <input
                type="text"
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
                placeholder="G..."
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Limit (stroops)
              <input
                type="number"
                min="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valid for (ledgers from now)
              <input
                type="number"
                min="1"
                value={validForLedgers}
                onChange={(e) => setValidForLedgers(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="mt-1 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {creating ? "Creating..." : "Create mandate"}
            </button>
            {createResult && <TransactionResult result={createResult} />}
          </form>

          <form
            onSubmit={handleSpend}
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
          >
            <span className="text-sm font-medium">3. Spend against a mandate</span>
            <label className="flex flex-col gap-1 text-sm">
              Mandate ID
              <input
                type="number"
                min="0"
                value={spendMandateId}
                onChange={(e) => setSpendMandateId(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Amount (stroops)
              <input
                type="number"
                min="1"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Destination address
              <input
                type="text"
                value={spendDestination}
                onChange={(e) => setSpendDestination(e.target.value)}
                placeholder="G..."
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <button
              type="submit"
              disabled={spending}
              className="mt-1 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {spending ? "Spending..." : "Spend"}
            </button>
            {spendResult && <TransactionResult result={spendResult} />}
          </form>

          <form
            onSubmit={handleRevoke}
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
          >
            <span className="text-sm font-medium">Revoke a mandate</span>
            <label className="flex flex-col gap-1 text-sm">
              Mandate ID
              <input
                type="number"
                min="0"
                value={revokeMandateId}
                onChange={(e) => setRevokeMandateId(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <button
              type="submit"
              disabled={revoking}
              className="mt-1 rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              {revoking ? "Revoking..." : "Revoke"}
            </button>
            {revokeResult && <TransactionResult result={revokeResult} />}
          </form>

          <form
            onSubmit={handleLookup}
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
          >
            <span className="text-sm font-medium">Look up a mandate</span>
            <label className="flex flex-col gap-1 text-sm">
              Mandate ID
              <input
                type="number"
                min="0"
                value={lookupMandateId}
                onChange={(e) => setLookupMandateId(e.target.value)}
                required
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
            </label>
            <button
              type="submit"
              disabled={lookupLoading}
              className="mt-1 rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              {lookupLoading ? "Looking up..." : "Get mandate"}
            </button>
            {lookupResult && (
              <pre className="whitespace-pre-wrap break-words rounded-lg border border-black/[.06] p-2 text-xs dark:border-white/[.1]">
                {lookupResult}
              </pre>
            )}
            {lookupError && (
              <p className="text-sm text-red-600 dark:text-red-400">{lookupError}</p>
            )}
          </form>

          <div className="mx-4 w-full max-w-sm">
            <EventFeed events={events} />
          </div>
        </>
      )}
    </div>
  );
}
