import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/server/orpc";

export type SyncDeltaEntry = Awaited<ReturnType<typeof orpc.sync.getDelta>>["changes"][number];

/** How often the client polls for household changes while active. */
const SYNC_POLL_INTERVAL_MS = 30_000;

/**
 * Polling-first sync: pulls `{seq, effects[]}` deltas since the household
 * watermark on an interval and on app foreground. Identical to what a future
 * push path (#93) would deliver — push would only change when the poll
 * triggers, never what it returns.
 *
 * Entries carry no row data; consumers invalidate local caches by effect tag.
 *
 * @deprecated Superseded by `useSyncWorker` (#85), which persists the
 * watermark in `sync_state`, drains the outbox, and invalidates caches.
 * Do not adopt in new screens; remove once no callers remain.
 */
export function useSyncDeltas(householdId: string | null) {
  const { data: session, isPending } = authClient.useSession();
  const watermarkRef = useRef(0);
  const [error, setError] = useState<Error | null>(null);

  const enabled = !isPending && Boolean(session) && Boolean(householdId);

  const query = useQuery({
    queryKey: ["sync", "delta", householdId],
    queryFn: async () => {
      try {
        const delta = await orpc.sync.getDelta({
          householdId: householdId!,
          since: watermarkRef.current,
        });
        watermarkRef.current = delta.seq;
        setError(null);
        return delta;
      } catch (err) {
        // Surface the failure without crashing the app; the next poll retries.
        setError(err instanceof Error ? err : new Error("Sync failed."));
        throw err;
      }
    },
    enabled,
    refetchInterval: SYNC_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  // Reset the watermark when addressing a different household.
  useEffect(() => {
    watermarkRef.current = 0;
  }, [householdId]);

  // App-foreground refocus — react-query's window-focus option only covers web.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void query.refetch();
      }
    });
    return () => subscription.remove();
  }, [enabled, query]);

  return {
    /** Notification-shaped changes since the previous poll. */
    changes: query.data?.changes ?? [],
    /** Current head watermark of the household's change log. */
    seq: query.data?.seq ?? 0,
    hasMore: query.data?.hasMore ?? false,
    isPending: query.isPending,
    isSyncing: query.isFetching,
    error,
    refetch: query.refetch,
  };
}
