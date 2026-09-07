import { useDatabase } from "@/db/client";
import { toLedgerTransactionResource } from "@/modules/ledger-db/compat";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";
import { isPowerSyncEnabled } from "@/modules/powersync/feature";

import {
  useLocalAccountDataSource,
  useLocalCategoryDataSource,
  useLocalTransactionDataSource,
} from "./local";
import { useLedgerSourceSelection } from "./provider";
import { createSyncedLedgerDataSource } from "./synced";
import { createLegacySyncedLedgerDataSource } from "./synced-legacy";
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
  const ledger = useSyncedTransactionLedger();
  if (selection.kind === "local") {
    return local;
  }
  return ledger
    ? createSyncedLedgerDataSource({
        householdId: selection.householdId,
        userId: selection.userId,
        ledger,
        offlineState: selection.offlineState,
      })
    : createFlagOffSource(selection, db);
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
  return createFlagOffSource(selection, db);
};

export const useCategoryDataSource = (): LedgerCategoryDataSource => {
  const selection = useLedgerSourceSelection();
  const db = useDatabase();
  const local = useLocalCategoryDataSource();
  const ledger = useSyncedTransactionLedger();
  if (selection.kind === "local") {
    return local;
  }
  return ledger
    ? createSyncedLedgerDataSource({
        householdId: selection.householdId,
        userId: selection.userId,
        ledger,
        offlineState: selection.offlineState,
      })
    : createFlagOffSource(selection, db);
};

const createFlagOffSource = (
  selection: Exclude<ReturnType<typeof useLedgerSourceSelection>, { kind: "local" }>,
  db: ReturnType<typeof useDatabase>,
) => {
  if (isPowerSyncEnabled()) {
    throw new Error("PowerSync ledger is not ready for the selected household.");
  }
  return createLegacySyncedLedgerDataSource({
    householdId: selection.householdId,
    userId: selection.userId,
    db,
    offlineState: selection.offlineState,
  });
};
