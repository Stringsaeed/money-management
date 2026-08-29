import { useSyncWorker } from "@/hooks/use-sync-worker";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";

/**
 * Mounts the background sync worker (#85) inside the provider tree: drains
 * the outbox and pulls deltas on mount, on app focus, and on an interval for
 * the active household. Renders nothing.
 */
export function SyncWorker() {
  const selection = useLedgerSourceSelection();
  useSyncWorker(
    selection.kind === "synced" ? selection.householdId : null,
    selection.kind === "synced" ? selection.userId : undefined,
  );
  return null;
}
