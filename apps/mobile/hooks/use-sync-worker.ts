import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";
import {
  connectPowerSync,
  disconnectPowerSync,
  peekPowerSyncDatabase,
} from "@/modules/powersync/database";
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

  const syncNow = useCallback(async () => {
    if (!householdId || !userId || statusQuery.data?.killSwitchLocalOnly) return;
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await connectPowerSync(userId);
      await refreshPendingCount();
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error("PowerSync connection failed."));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [householdId, refreshPendingCount, statusQuery.data?.killSwitchLocalOnly, userId]);

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
          await connectPowerSync(nextUserId);
          await refreshPendingCount();
        },
        disconnect: disconnectPowerSync,
        reason: () => useSyncModeStore.getState().reason,
        setLocalOnly: store.setLocalOnly,
        setSynced: store.setSynced,
      },
    ).catch((error) => {
      setLastError(error instanceof Error ? error : new Error("PowerSync connection failed."));
    });
    if (!householdId || !userId) setPendingCount(0);
  }, [householdId, refreshPendingCount, statusQuery.data, userId]);

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
