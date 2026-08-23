import { useSyncWorker } from "@/hooks/use-sync-worker";
import { useActiveHousehold } from "@/hooks/use-households";

/**
 * Mounts the background sync worker (#85) inside the provider tree: drains
 * the outbox and pulls deltas on mount, on app focus, and on an interval for
 * the active household. Renders nothing.
 */
export function SyncWorker() {
  const { activeHousehold } = useActiveHousehold();
  useSyncWorker(activeHousehold?.householdId ?? null);
  return null;
}
