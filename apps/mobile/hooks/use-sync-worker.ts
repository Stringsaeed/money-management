import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import {
  countPendingCommands,
  discardRejectedCommand,
  drainOutbox,
  listRejectedChanges,
  pullDeltas,
  retryRejectedCommand,
  type RejectedChange,
} from "@/lib/sync/outbox";
import { orpc } from "@/lib/server/orpc";
import { ledgerQueriesForEffects } from "@/hooks/use-ledger";

/** How often the worker drains the outbox and pulls deltas while active. */
const SYNC_INTERVAL_MS = 30_000;

/**
 * The background sync worker (#85): on mount, on app focus, and on an
 * interval it drains the outbox to `commands.apply` in FIFO order, then pulls
 * `sync.getDelta` since the persisted watermark. Delta effect tags invalidate
 * the ledger react-query entries so screens converge without knowing about
 * the transport.
 *
 * Polling is the shipped notification path; push (#93) would only change
 * when a turn triggers, never what it returns.
 */
export function useSyncWorker(householdId: string | null) {
  const db = useDatabase();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedChanges, setRejectedChanges] = useState<readonly RejectedChange[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const syncingRef = useRef(false);

  const refreshCounters = useCallback(async () => {
    if (!householdId) {
      setPendingCount(0);
      setRejectedChanges([]);
      return;
    }
    try {
      const [pending, rejected] = await Promise.all([
        countPendingCommands(db, householdId),
        listRejectedChanges(db, householdId),
      ]);
      setPendingCount(pending);
      setRejectedChanges(rejected);
    } catch (err) {
      setLastError(err instanceof Error ? err : new Error("Sync state read failed."));
    }
  }, [db, householdId]);

  const runSyncTurn = useCallback(async () => {
    if (!householdId || syncingRef.current) {
      return;
    }
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      // Drain first: local intent leaves before remote changes arrive, so a
      // rejected command is visible in the inbox as soon as possible.
      const summary = await drainOutbox(db, (envelope) =>
        orpc.commands.apply({
          ...envelope,
          preconditions: envelope.preconditions ? [...envelope.preconditions] : undefined,
        }),
      );

      const delta = await pullDeltas(db, (args) => orpc.sync.getDelta(args), householdId);

      for (const change of delta.changes) {
        for (const segment of ledgerQueriesForEffects(change.effects)) {
          void queryClient.invalidateQueries({ queryKey: ["ledger", segment, householdId] });
        }
      }

      // Transport-stopped drains report an accurate pending count too.
      if (summary.applied > 0 || summary.rejected > 0 || summary.stoppedOnNetworkError) {
        await refreshCounters();
      } else {
        setPendingCount(summary.pending);
      }
      setLastError(null);
    } catch (err) {
      // Surfaced without crashing; the next turn retries.
      setLastError(err instanceof Error ? err : new Error("Sync failed."));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [db, householdId, queryClient, refreshCounters]);

  // Initial + per-household kick-off.
  useEffect(() => {
    void runSyncTurn();
    void refreshCounters();
  }, [runSyncTurn, refreshCounters]);

  // Interval polling.
  useEffect(() => {
    if (!householdId) {
      return;
    }
    const timer = setInterval(() => {
      void runSyncTurn();
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [householdId, runSyncTurn]);

  // App-foreground refocus — react-query's window-focus option only covers web.
  useEffect(() => {
    if (!householdId) {
      return;
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runSyncTurn();
      }
    });
    return () => subscription.remove();
  }, [householdId, runSyncTurn]);

  const discardRejected = useCallback(
    async (commandId: string) => {
      await discardRejectedCommand(db, commandId);
      await refreshCounters();
    },
    [db, refreshCounters],
  );

  const retryRejected = useCallback(
    async (commandId: string) => {
      await retryRejectedCommand(db, commandId);
      await refreshCounters();
      await runSyncTurn();
    },
    [db, refreshCounters, runSyncTurn],
  );

  return {
    pendingCount,
    rejectedChanges,
    isSyncing,
    error: lastError,
    /** Runs one drain+pull turn immediately. */
    syncNow: runSyncTurn,
    discardRejected,
    retryRejected,
  };
}
