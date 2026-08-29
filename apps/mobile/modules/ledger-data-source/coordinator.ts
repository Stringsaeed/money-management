import type { CommandEnvelope } from "@trove/protocol";

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
  const local = useLocalAccountDataSource();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    offlineState: selection.offlineState,
  });
};

export const useTransactionDataSource = (): LedgerTransactionDataSource => {
  const selection = useLedgerSourceSelection();
  const local = useLocalTransactionDataSource();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    offlineState: selection.offlineState,
  });
};

export const useLedgerLifecycle = () => {
  const selection = useLedgerSourceSelection();
  if (selection.kind === "local") {
    return {
      source: "local" as const,
      offlineState: { kind: "offline_ready" as const },
      hydration: {
        pull: async () => ({
          status: "not_required" as const,
          reason: "local_authoritative" as const,
        }),
      },
      writeback: {
        submit: async (_command: CommandEnvelope) => ({
          status: "not_required" as const,
          reason: "local_authoritative" as const,
        }),
      },
    };
  }
  const synced = createSyncedLedgerDataSource({
    householdId: selection.householdId,
    offlineState: selection.offlineState,
  });
  return {
    source: synced.source,
    offlineState: synced.offlineState,
    hydration: synced.hydration,
    writeback: synced.writeback,
  };
};

export const useCategoryDataSource = (): LedgerCategoryDataSource => {
  const selection = useLedgerSourceSelection();
  const local = useLocalCategoryDataSource();
  if (selection.kind === "local") {
    return local;
  }
  return createSyncedLedgerDataSource({
    householdId: selection.householdId,
    offlineState: selection.offlineState,
  });
};
