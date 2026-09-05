import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { CommandEnvelope } from "@trove/protocol";

import { useDatabase } from "@/db/client";
import { useHouseholdPush } from "@/hooks/use-household-push";
import {
  countPendingCommands,
  discardRejectedCommand,
  drainOutbox,
  listRejectedChanges,
  pullDeltas,
  retryRejectedCommand,
  type DrainSummary,
  type LocalDb,
  type RejectedChange,
} from "@/lib/sync/outbox";
import {
  createDeltaAvailabilityTracker,
  isDeltaPullDegraded,
  recordDeltaPullFailure,
  recordDeltaPullSuccess,
  type DeltaAvailabilityTracker,
} from "@/lib/sync/degradation";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import { orpc } from "@/lib/server/orpc";
import { createLedgerDependencies } from "@/modules/ledger-db/deps";
import type { SyncedTransactionLedger } from "@/modules/ledger-db/ledger";
import { acquireSyncedTransactionLedger } from "@/modules/ledger-db/registry";
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
  const ledgerRef = useRef<SyncedTransactionLedger | null>(null);
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

  useEffect(() => {
    if (!householdId || !userId) {
      ledgerRef.current = null;
      return;
    }
    const handle = acquireSyncedTransactionLedger(
      createLedgerDependencies({ householdId, userId, db }),
    );
    ledgerRef.current = handle.ledger;
    return () => {
      handle.release();
      if (ledgerRef.current === handle.ledger) ledgerRef.current = null;
    };
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
    if (
      !householdId ||
      syncingRef.current ||
      shouldSkipSyncTurn(householdId, statusPending, killSwitchRef.current)
    ) {
      return;
    }
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await executeSyncTurn({
        db,
        householdId,
        userId,
        queryClient,
        ledger: ledgerRef.current,
        deltaAvailability,
        refreshCounters,
        setLastError,
      });
    } catch (err) {
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

const shouldSkipSyncTurn = (
  householdId: string | null,
  statusPending: boolean,
  killSwitch: boolean | null,
): boolean =>
  !householdId ||
  statusPending ||
  useSyncModeStore.getState().reason === "kill_switch" ||
  killSwitch === true;

interface SyncTurnInput {
  readonly db: LocalDb;
  readonly householdId: string;
  readonly userId?: string;
  readonly queryClient: QueryClient;
  readonly ledger: SyncedTransactionLedger | null;
  readonly deltaAvailability: { current: DeltaAvailabilityTracker };
  readonly refreshCounters: () => Promise<void>;
  readonly setLastError: (error: Error | null) => void;
}

const executeSyncTurn = async ({
  db,
  householdId,
  userId,
  queryClient,
  ledger,
  deltaAvailability,
  refreshCounters,
  setLastError,
}: SyncTurnInput): Promise<void> => {
  const summary = await drainOutbox(
    db,
    householdId,
    (envelope) => applyAndSettle(envelope, ledger),
    userId,
  );
  await applyDrainEffects(summary, queryClient, ledger);
  const pullFailed = await tryPullAndNote(
    db,
    householdId,
    queryClient,
    ledger,
    deltaAvailability,
    setLastError,
  );
  await refreshCounters();
  if (!pullFailed) setLastError(null);
};

const applyDrainEffects = async (
  summary: DrainSummary,
  queryClient: QueryClient,
  ledger: SyncedTransactionLedger | null,
): Promise<void> => {
  if (summary.stoppedOnLocalOnly) {
    useSyncModeStore.getState().setLocalOnly("kill_switch");
  }
  if ((summary.applied > 0 || summary.rejected > 0) && !ledger) {
    await cohereTransactionSurfaces(queryClient);
  }
};

const tryPullAndNote = async (
  db: LocalDb,
  householdId: string,
  queryClient: QueryClient,
  ledger: SyncedTransactionLedger | null,
  deltaAvailability: { current: DeltaAvailabilityTracker },
  setLastError: (error: Error | null) => void,
): Promise<boolean> => {
  try {
    await pullAndNote(db, householdId, queryClient, ledger, deltaAvailability);
    return false;
  } catch (err) {
    setLastError(err instanceof Error ? err : new Error("Delta pull failed."));
    return true;
  }
};

const applyAndSettle = async (
  envelope: CommandEnvelope,
  ledger: SyncedTransactionLedger | null,
) => {
  const result = await orpc.commands.apply({
    ...envelope,
    preconditions: envelope.preconditions?.map((precondition) => ({ ...precondition })),
  });
  ledger?.settle(envelope, result);
  return result;
};

const pullAndNote = async (
  db: LocalDb,
  householdId: string,
  queryClient: QueryClient,
  ledger: SyncedTransactionLedger | null,
  deltaAvailability: { current: DeltaAvailabilityTracker },
): Promise<void> => {
  try {
    const delta = await pullDeltas(db, (args) => orpc.sync.getDelta(args), householdId);
    deltaAvailability.current = recordDeltaPullSuccess(deltaAvailability.current, Date.now());
    if (useSyncModeStore.getState().reason === "delta_unavailable") {
      useSyncModeStore.getState().setSynced();
    }
    ledger?.noteRemoteChanges(delta.changes);
    for (const change of delta.changes) {
      await cohereLedgerEffects(queryClient, change.effects);
    }
  } catch (error) {
    deltaAvailability.current = recordDeltaPullFailure(deltaAvailability.current, Date.now());
    if (isDeltaPullDegraded(deltaAvailability.current, Date.now())) {
      useSyncModeStore.getState().setLocalOnly("delta_unavailable");
    }
    throw error;
  }
};
