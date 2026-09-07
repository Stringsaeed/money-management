import { useLegacySyncWorker } from "@/hooks/use-legacy-sync-worker";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";

export function LegacySyncWorker() {
  const selection = useLedgerSourceSelection();
  useLegacySyncWorker(
    selection.kind === "synced" ? selection.householdId : null,
    selection.kind === "synced" ? selection.userId : undefined,
  );
  return null;
}
