import { PowerSyncWorker } from "@/components/sync/powersync-worker";

/**
 * Mounts the PowerSync worker inside the provider tree. It maintains the
 * connection, upload-queue status, kill switch, and degraded-mode state for
 * the active household. Renders nothing.
 */
export function SyncWorker() {
  return <PowerSyncWorker />;
}
