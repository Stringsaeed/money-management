import { useDatabase } from "@/db/client";
import { toLedgerTransactionResource } from "@/modules/ledger-db/compat";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";

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
  const db = useDatabase();
  const local = useLocalAccountDataSource();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    db,
    offlineState: selection.offlineState,
  });
};

export const useTransactionDataSource = (): LedgerTransactionDataSource => {
  const selection = useLedgerSourceSelection();
  const db = useDatabase();
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
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    db,
    offlineState: selection.offlineState,
  });
};

export const useCategoryDataSource = (): LedgerCategoryDataSource => {
  const selection = useLedgerSourceSelection();
  const db = useDatabase();
  const local = useLocalCategoryDataSource();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    db,
    offlineState: selection.offlineState,
  });
};
