"use client";

import { MandateEvent } from "@/lib/mandateContract";

const EVENT_LABELS: Record<string, string> = {
  mandate_created: "Mandate created",
  mandate_spent: "Spend recorded",
  mandate_revoked: "Mandate revoked",
};

function formatData(data: unknown): string {
  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(", ");
  }
  return String(data);
}

export default function EventFeed({ events }: { events: MandateEvent[] }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Live contract events</span>
        <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          watching testnet
        </span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No events yet. Create a mandate to see it appear here in real time.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {[...events].reverse().map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-black/[.06] p-2 dark:border-white/[.1]"
            >
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{EVENT_LABELS[event.name] ?? event.name}</span>
                <span>ledger {event.ledger}</span>
              </div>
              {event.mandateId !== undefined && (
                <p className="mt-1">Mandate #{event.mandateId}</p>
              )}
              <p className="mt-1 break-words text-xs text-zinc-500 dark:text-zinc-400">
                {formatData(event.data)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
