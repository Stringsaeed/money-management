import { useQueryClient } from "@tanstack/react-query";

import { useSQLiteContext } from "@/db/sqlite";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { createSyncedBudgetingCoordinator } from "@/modules/budgeting/synced";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";

export const useBudgetingCoordinator = () => {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  const selection = useLedgerSourceSelection();
  const ledger = useSyncedTransactionLedger();
  // Budgeting is Household-owned (#227), so a Personal Ledger keeps budgeting
  // on-device rather than writing envelopes no stream would ever return.
  if (selection.kind === "synced" && selection.ledger.householdId !== null) {
    if (!ledger) throw new Error("PowerSync budget collections are not ready.");
    return createSyncedBudgetingCoordinator({
      database,
      queryClient,
      householdId: selection.ledger.householdId,
      userId: selection.userId,
      ledger,
    });
  }
  return createBudgetingCoordinator(database, { queryClient });
};
