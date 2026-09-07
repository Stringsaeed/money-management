import { LegacySyncWorker } from "@/components/sync/legacy-sync-worker";
import { PowerSyncWorker } from "@/components/sync/powersync-worker";
import { isPowerSyncEnabled } from "@/modules/powersync/feature";

/**
 * Mounts the background sync worker (#85) inside the provider tree: drains
 * the outbox and pulls deltas on mount, on app focus, and on an interval for
 * the active household. Renders nothing.
 */
export function SyncWorker() {
  return isPowerSyncEnabled() ? <PowerSyncWorker /> : <LegacySyncWorker />;
}
