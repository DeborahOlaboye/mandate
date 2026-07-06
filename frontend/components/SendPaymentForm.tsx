"use client";

import { useState } from "react";
import { isValidStellarAddress } from "@/lib/validation";

interface SendPaymentFormProps {
  disabled: boolean;
  sending: boolean;
  onSend: (destination: string, amount: string) => void;
}

export default function SendPaymentForm({
  disabled,
  sending,
  onSend,
}: SendPaymentFormProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !amount) return;
    if (!isValidStellarAddress(destination)) {
      setFormError("Enter a valid Stellar public key (starts with G, 56 characters).");
      return;
    }
    setFormError(null);
    onSend(destination, amount);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
    >
      <label className="flex flex-col gap-1 text-sm">
        Destination address
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G..."
          disabled={disabled || sending}
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 disabled:opacity-50 dark:border-white/[.145] dark:focus:border-white/40"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Amount (XLM)
        <input
          type="number"
          min="0.0000001"
          step="0.0000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10"
          disabled={disabled || sending}
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 disabled:opacity-50 dark:border-white/[.145] dark:focus:border-white/40"
          required
        />
      </label>
      <button
        type="submit"
        disabled={disabled || sending}
        className="mt-1 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {sending ? "Sending..." : "Send XLM"}
      </button>
      {formError && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}
    </form>
  );
}
