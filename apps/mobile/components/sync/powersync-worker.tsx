import { useSyncEnrollment } from "@/hooks/use-enable-sync";
import { useSyncWorker } from "@/hooks/use-sync-worker";
import {
  coreFromAccess,
  NO_SYNC_ENROLLMENT,
  selectLedgerSourceForAccess,
  useAccess,
} from "@/modules/access";
import { useSyncModeStore } from "@/stores/sync-mode-store";

export function PowerSyncWorker() {
  const access = useAccess();
  const enrollment = useSyncEnrollment();
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);
  const selection = selectLedgerSourceForAccess(
    coreFromAccess(access),
    enrollment.data ?? NO_SYNC_ENROLLMENT,
    mode,
    reason,
  );
  const canConnect = access.kind === "signed_in" && selection.kind === "synced";
  useSyncWorker(
    canConnect ? selection.ledger.ledgerId : null,
    canConnect ? selection.userId : undefined,
    access.kind !== "anonymous",
  );
  return null;
}
