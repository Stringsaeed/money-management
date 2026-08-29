import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { useHouseholdPush } from "@/hooks/use-household-push";
import {
  countPendingCommands,
  discardRejectedCommand,
  drainOutbox,
  listRejectedChanges,
  pullDeltas,
  retryRejectedCommand,
  type RejectedChange,
} from "@/lib/sync/outbox";
import {
  createDeltaAvailabilityTracker,
  isDeltaPullDegraded,
  recordDeltaPullFailure,
  recordDeltaPullSuccess,
} from "@/lib/sync/degradation";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import { orpc } from "@/lib/server/orpc";
import { cohereLedgerEffects, cohereTransactionSurfaces } from "@/modules/ledger-cache";

/** How often the worker drains the outbox and pulls deltas while active. */
const SYNC_INTERVAL_MS = 30_000;

/** How often the remote kill switch is re-checked while polling. */
const KILL_SWITCH_POLL_INTERVAL_MS = 5 * 60_000;

/**
 * The background sync worker (#85): on mount, on app focus, and on an
 * interval it drains the outbox to `commands.apply` in FIFO order, then pulls
 * `sync.getDelta` since the persisted watermark. Delta effect tags invalidate
 * the ledger react-query entries so screens converge without knowing about
 * the transport.
 *
 * Kill switch & graceful degradation (#99):
 * - the app polls `sync.status()` on startup (and every few minutes); while
 *   the remote `kill_switch_local_only` flag is engaged, turns are skipped
 *   and the app renders in local-only mode;
 * - consecutive failed delta pulls are tracked — once pulls have been
 *   unavailable for 10+ minutes the app degrades to local-only mode, and the
 *   next successful pull restores synced mode.
 *
 * Polling is the shipped notification path; push (#93) would only change
 * when a turn triggers, never what it returns.
 */
export function useSyncWorker(householdId: string | null, userId?: string) {
  const db = useDatabase();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedChanges, setRejectedChanges] = useState<readonly RejectedChange[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  /** True until the startup status probe settles — turns wait for it. */
  const [statusPending, setStatusPending] = useState(Boolean(householdId));
  const syncingRef = useRef(false);
  const deltaAvailability = useRef(createDeltaAvailabilityTracker());
  /** null = unknown yet (fail-open; the server's local_only result backstops). */
  const killSwitchRef = useRef<boolean | null>(null);

  const refreshCounters = useCallback(async () => {
    if (!householdId) {
      setPendingCount(0);
      setRejectedChanges([]);
      return;
    }
    try {
      const [pending, rejected] = await Promise.all([
        countPendingCommands(db, householdId, userId),
        listRejectedChanges(db, householdId, userId),
      ]);
      setPendingCount(pending);
      setRejectedChanges(rejected);
    } catch (err) {
      setLastError(err instanceof Error ? err : new Error("Sync state read failed."));
    }
  }, [db, householdId, userId]);

  // Remote kill-switch probe (#99): checked on startup and re-polled on an
  // interval so turning the flag off restores synced mode without a restart.
  const statusQuery = useQuery({
    queryKey: ["sync", "status", householdId],
    queryFn: () => orpc.sync.status(),
    enabled: Boolean(householdId),
    refetchInterval: KILL_SWITCH_POLL_INTERVAL_MS,
  });

  useEffect(() => {
    setStatusPending(Boolean(householdId) && statusQuery.isPending);
    killSwitchRef.current =
      householdId && statusQuery.data ? statusQuery.data.killSwitchLocalOnly : null;
    if (!householdId || !statusQuery.data) {
      return;
    }
    const { reason, setLocalOnly, setSynced } = useSyncModeStore.getState();
    if (statusQuery.data.killSwitchLocalOnly) {
      if (reason !== "kill_switch") {
        setLocalOnly("kill_switch");
      }
    } else if (reason === "kill_switch") {
      setSynced();
    }
  }, [householdId, statusQuery.data, statusQuery.isPending]);

  const runSyncTurn = useCallback(async () => {
    if (!householdId || syncingRef.current) {
      return;
    }
    if (householdId && statusPending) {
      // Startup kill-switch check (#99) has not settled yet — hold turns.
      return;
    }
    if (useSyncModeStore.getState().reason === "kill_switch" || killSwitchRef.current === true) {
      return;
    }
    syncingRef.current = true;
    setIsSyncing(true);
    let pullFailed = false;
    try {
      // Drain first: local intent leaves before remote changes arrive, so a
      // rejected command is visible in the inbox as soon as possible.
      // The generated oRPC input is mutable; keep the stored outbox envelope immutable.
      const summary = await drainOutbox(
        db,
        householdId,
        (envelope) =>
          orpc.commands.apply({
            ...envelope,
            preconditions: envelope.preconditions?.map((precondition) => ({ ...precondition })),
          }),
        userId,
      );

      if (summary.stoppedOnLocalOnly) {
        useSyncModeStore.getState().setLocalOnly("kill_switch");
      }

      if (summary.applied > 0 || summary.rejected > 0) {
        await cohereTransactionSurfaces(queryClient);
      }

      try {
        const delta = await pullDeltas(db, (args) => orpc.sync.getDelta(args), householdId);

        deltaAvailability.current = recordDeltaPullSuccess(deltaAvailability.current, Date.now());
        if (useSyncModeStore.getState().reason === "delta_unavailable") {
          useSyncModeStore.getState().setSynced();
        }

        for (const change of delta.changes) {
          await cohereLedgerEffects(queryClient, change.effects);
        }
      } catch (err) {
        pullFailed = true;
        deltaAvailability.current = recordDeltaPullFailure(deltaAvailability.current, Date.now());
        if (isDeltaPullDegraded(deltaAvailability.current, Date.now())) {
          useSyncModeStore.getState().setLocalOnly("delta_unavailable");
        }
        setLastError(err instanceof Error ? err : new Error("Delta pull failed."));
      }

      // Transport-stopped drains report an accurate pending count too.
      if (summary.applied > 0 || summary.rejected > 0 || summary.stoppedOnNetworkError) {
        await refreshCounters();
      } else {
        setPendingCount(summary.pending);
      }
      if (!pullFailed) {
        setLastError(null);
      }
    } catch (err) {
      // Surfaced without crashing; the next turn retries.
      setLastError(err instanceof Error ? err : new Error("Sync failed."));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [db, householdId, queryClient, refreshCounters, statusPending, userId]);

  // Realtime push (#93): a household notice triggers the same drain+pull turn
  // as polling — push only changes when it runs, never what it computes.
  useHouseholdPush(householdId, runSyncTurn);

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
  const refetchStatus = statusQuery.refetch;
  useEffect(() => {
    if (!householdId) {
      return;
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refetchStatus();
        void runSyncTurn();
      }
    });
    return () => subscription.remove();
  }, [householdId, runSyncTurn, refetchStatus]);

  const discardRejected = useCallback(
    async (commandId: string) => {
      await discardRejectedCommand(db, commandId);
      await cohereTransactionSurfaces(queryClient);
      await refreshCounters();
    },
    [db, queryClient, refreshCounters],
  );

  const retryRejected = useCallback(
    async (commandId: string) => {
      await retryRejectedCommand(db, commandId);
      await cohereTransactionSurfaces(queryClient);
      await refreshCounters();
      await runSyncTurn();
    },
    [db, queryClient, refreshCounters, runSyncTurn],
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
