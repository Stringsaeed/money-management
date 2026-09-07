import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { PowerSyncDatabase, SyncStatus } from "@powersync/react-native";

import { orpc } from "@/lib/server/orpc";
import {
  connectPowerSync,
  disconnectAndClearPowerSync,
  disconnectPowerSync,
  peekPowerSyncDatabase,
} from "@/modules/powersync/database";
import {
  initialPowerSyncAvailability,
  isPowerSyncUnavailable,
  POWERSYNC_DISCONNECT_THRESHOLD_MS,
  recordPowerSyncConnection,
} from "@/modules/powersync/availability";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import type { RejectedChange } from "@/modules/powersync/rejected-changes";
import { reconcilePowerSyncStatus } from "@/modules/powersync/status";

const KILL_SWITCH_POLL_INTERVAL_MS = 5 * 60_000;
const QUEUE_STATUS_INTERVAL_MS = 5_000;
const EMPTY_REJECTED_CHANGES: readonly RejectedChange[] = [];

export function useSyncWorker(householdId: string | null, userId?: string) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const syncingRef = useRef(false);
  const observedDatabaseRef = useRef<PowerSyncDatabase | null>(null);
  const statusUnsubscribeRef = useRef<(() => void) | null>(null);
  const degradationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const availabilityRef = useRef(initialPowerSyncAvailability());

  const statusQuery = useQuery({
    queryKey: ["sync", "status", householdId],
    queryFn: () => orpc.sync.status(),
    enabled: Boolean(householdId && userId),
    refetchInterval: KILL_SWITCH_POLL_INTERVAL_MS,
  });

  const refreshPendingCount = useCallback(async () => {
    const database = peekPowerSyncDatabase();
    if (!database) {
      setPendingCount(0);
      return;
    }
    const stats = await database.getUploadQueueStats();
    setPendingCount(stats.count);
  }, []);

  const clearAvailabilityObserver = useCallback(() => {
    statusUnsubscribeRef.current?.();
    statusUnsubscribeRef.current = null;
    observedDatabaseRef.current = null;
    availabilityRef.current = initialPowerSyncAvailability();
    if (degradationTimerRef.current) clearTimeout(degradationTimerRef.current);
    degradationTimerRef.current = null;
  }, []);

  const recordAvailability = useCallback((status: SyncStatus) => {
    const now = Date.now();
    availabilityRef.current = recordPowerSyncConnection(
      availabilityRef.current,
      status.connected,
      now,
    );
    if (status.connected) {
      if (degradationTimerRef.current) clearTimeout(degradationTimerRef.current);
      degradationTimerRef.current = null;
      if (useSyncModeStore.getState().reason === "powersync_unavailable") {
        useSyncModeStore.getState().setSynced();
      }
      return;
    }
    if (degradationTimerRef.current) return;
    degradationTimerRef.current = setTimeout(() => {
      degradationTimerRef.current = null;
      if (
        isPowerSyncUnavailable(availabilityRef.current, Date.now()) &&
        useSyncModeStore.getState().reason !== "kill_switch"
      ) {
        useSyncModeStore.getState().setLocalOnly("powersync_unavailable");
      }
    }, POWERSYNC_DISCONNECT_THRESHOLD_MS);
  }, []);

  const observeAvailability = useCallback(
    (database: PowerSyncDatabase) => {
      if (observedDatabaseRef.current === database) return;
      clearAvailabilityObserver();
      observedDatabaseRef.current = database;
      statusUnsubscribeRef.current = database.registerListener({
        statusChanged: recordAvailability,
      });
      recordAvailability(database.currentStatus);
    },
    [clearAvailabilityObserver, recordAvailability],
  );

  const syncNow = useCallback(async () => {
    if (!householdId || !userId || statusQuery.data?.killSwitchLocalOnly) return;
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      observeAvailability(await connectPowerSync(userId));
      await refreshPendingCount();
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error("PowerSync connection failed."));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [
    householdId,
    observeAvailability,
    refreshPendingCount,
    statusQuery.data?.killSwitchLocalOnly,
    userId,
  ]);

  useEffect(() => {
    const store = useSyncModeStore.getState();
    void reconcilePowerSyncStatus(
      {
        householdId,
        userId,
        killSwitchLocalOnly: statusQuery.data?.killSwitchLocalOnly,
      },
      {
        connect: async (nextUserId) => {
          observeAvailability(await connectPowerSync(nextUserId));
          await refreshPendingCount();
        },
        disconnect: disconnectPowerSync,
        disconnectAndClear: async () => {
          clearAvailabilityObserver();
          await disconnectAndClearPowerSync();
        },
        reason: () => useSyncModeStore.getState().reason,
        setLocalOnly: store.setLocalOnly,
        setSynced: store.setSynced,
      },
    ).catch((error) => {
      setLastError(error instanceof Error ? error : new Error("PowerSync connection failed."));
    });
    if (!householdId || !userId) setPendingCount(0);
  }, [
    clearAvailabilityObserver,
    householdId,
    observeAvailability,
    refreshPendingCount,
    statusQuery.data,
    userId,
  ]);

  useEffect(() => clearAvailabilityObserver, [clearAvailabilityObserver]);

  useEffect(() => {
    if (!householdId || !userId) return;
    const timer = setInterval(() => void refreshPendingCount(), QUEUE_STATUS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [householdId, refreshPendingCount, userId]);

  const refetchStatus = statusQuery.refetch;
  useEffect(() => {
    if (!householdId || !userId) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void refetchStatus();
      void syncNow();
    });
    return () => subscription.remove();
  }, [householdId, refetchStatus, syncNow, userId]);

  return {
    pendingCount,
    rejectedChanges: EMPTY_REJECTED_CHANGES,
    isSyncing,
    error: lastError,
    syncNow,
  };
}
