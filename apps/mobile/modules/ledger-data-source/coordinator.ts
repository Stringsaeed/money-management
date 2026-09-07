import { toLedgerTransactionResource } from "@/modules/ledger-db/compat";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";
import type { SyncedTransactionLedger } from "@/modules/ledger-db/ledger";

import {
  useLocalAccountDataSource,
  useLocalCategoryDataSource,
  useLocalTransactionDataSource,
} from "./local";
import { useLedgerSourceSelection } from "./provider";
import { createSyncedLedgerDataSource } from "./synced";
import type {
  LedgerAccountDataSource,
  LedgerCategoryDataSource,
  LedgerTransactionDataSource,
} from "./contract";

const ignoreLedgerError = () => undefined;

export const useAccountDataSource = (): LedgerAccountDataSource => {
  const selection = useLedgerSourceSelection();
  const local = useLocalAccountDataSource();
  const ledger = useSyncedTransactionLedger();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    ledger: requireSyncedLedger(ledger),
    offlineState: selection.offlineState,
  });
};

export const useTransactionDataSource = (): LedgerTransactionDataSource => {
  const selection = useLedgerSourceSelection();
  const local = useLocalTransactionDataSource();
  const ledger = useSyncedTransactionLedger();
  if (selection.kind === "local") {
    return local;
  }
  if (ledger) {
    return {
      source: "synced",
      cacheKey: `synced:${selection.householdId}:${selection.userId}`,
      offlineState: selection.offlineState ?? { kind: "online" },
      transactions: toLedgerTransactionResource(ledger),
      observeErrors: () => ignoreLedgerError,
    };
  }
  throw new Error("PowerSync ledger is not ready for the selected household.");
};

export const useCategoryDataSource = (): LedgerCategoryDataSource => {
  const selection = useLedgerSourceSelection();
  const local = useLocalCategoryDataSource();
  const ledger = useSyncedTransactionLedger();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    ledger: requireSyncedLedger(ledger),
    offlineState: selection.offlineState,
  });
};

const requireSyncedLedger = (ledger: SyncedTransactionLedger | null): SyncedTransactionLedger => {
  if (!ledger) throw new Error("PowerSync ledger is not ready for the selected household.");
  return ledger;
};
