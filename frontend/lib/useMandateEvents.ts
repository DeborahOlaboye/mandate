"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMandateEvents, getLatestLedgerSequence, MandateEvent } from "@/lib/mandateContract";

const POLL_INTERVAL_MS = 6000;
const MAX_EVENTS = 30;
const LOOKBACK_LEDGERS = 200;

export function useMandateEvents(active: boolean) {
  const [events, setEvents] = useState<MandateEvent[]>([]);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const cursorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const cursor = cursorRef.current;
        const startPoint = cursor
          ? { cursor }
          : { startLedger: Math.max((await getLatestLedgerSequence()) - LOOKBACK_LEDGERS, 1) };

        const { events: newEvents, cursor: nextCursor } = await fetchMandateEvents(startPoint);
        cursorRef.current = nextCursor;

        if (!cancelled) {
          setConnectionIssue(false);
          if (newEvents.length > 0) {
            setEvents((prev) => [...prev, ...newEvents].slice(-MAX_EVENTS));
          }
        }
      } catch {
        // Transient RPC error; the next poll will retry. Surface it so the
        // UI can show a subtle "reconnecting" hint instead of failing silently.
        if (!cancelled) setConnectionIssue(true);
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active]);

  return { events, connectionIssue };
}
