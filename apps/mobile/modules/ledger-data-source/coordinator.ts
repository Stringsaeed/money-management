import { useDatabase } from "@/db/client";

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

export const useLedgerLifecycle = () => {
  const selection = useLedgerSourceSelection();
  const db = useDatabase();
  if (selection.kind === "local") {
    return {
      kind: "local" as const,
      offlineState: { kind: "offline_ready" as const },
    };
  }
  const synced = createSyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    db,
    offlineState: selection.offlineState,
  });
  return {
    kind: "synced" as const,
    offlineState: synced.offlineState,
    hydration: synced.hydration,
    writeback: synced.writeback,
  };
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
