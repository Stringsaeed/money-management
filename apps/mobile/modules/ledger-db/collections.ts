import type { PowerSyncDatabase } from "@powersync/react-native";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { createCollection, type CollectionStatus, type OperationConfig } from "@tanstack/react-db";

import {
  powerSyncAccounts,
  powerSyncCategories,
  powerSyncTransactions,
  rejectedChanges,
} from "@/modules/powersync/schema";

import {
  powerSyncAccountRowSchema,
  powerSyncCategoryRowSchema,
  powerSyncRejectedChangeRowSchema,
  powerSyncTransactionRowSchema,
  type PowerSyncAccountRow,
  type PowerSyncCategoryRow,
  type PowerSyncRejectedChangeRow,
  type PowerSyncTransactionRow,
} from "./types";

export interface LedgerCollectionMutation {
  readonly isPersisted: { readonly promise: Promise<unknown> };
}

export interface LedgerCollection<Row extends { id: string }> {
  readonly status: CollectionStatus;
  readonly toArray: readonly (Row & { readonly $synced: boolean })[];
  readonly get: (id: string) => (Row & { readonly $synced: boolean }) | undefined;
  readonly insert: (row: Row, config?: OperationConfig) => LedgerCollectionMutation;
  readonly update: (
    id: string,
    config: OperationConfig,
    update: (row: Row) => void,
  ) => LedgerCollectionMutation;
  readonly delete: (id: string, config?: OperationConfig) => LedgerCollectionMutation;
  readonly subscribeChanges: (listener: () => void) => { unsubscribe: () => void };
  readonly on: (event: "status:change", listener: () => void) => () => void;
  readonly preload: () => Promise<void>;
  readonly cleanup: () => Promise<void>;
}

export interface PowerSyncLedgerCollections {
  readonly accounts: LedgerCollection<PowerSyncAccountRow>;
  readonly categories: LedgerCollection<PowerSyncCategoryRow>;
  readonly transactions: LedgerCollection<PowerSyncTransactionRow>;
  readonly rejectedChanges: LedgerCollection<PowerSyncRejectedChangeRow>;
}

const householdStreamLoader = (database: PowerSyncDatabase, householdId: string) => async () => {
  const subscription = await database
    .syncStream("household_ledger", { household_id: householdId })
    .subscribe();
  await subscription.waitForFirstSync();
  return () => subscription.unsubscribe();
};

export const createPowerSyncLedgerCollections = (
  database: PowerSyncDatabase,
  householdId: string,
): PowerSyncLedgerCollections => {
  const onLoad = householdStreamLoader(database, householdId);
  return {
    accounts: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-accounts:${householdId}`,
        database,
        table: powerSyncAccounts,
        schema: powerSyncAccountRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Account row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad,
      }),
    ),
    categories: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-categories:${householdId}`,
        database,
        table: powerSyncCategories,
        schema: powerSyncCategoryRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Category row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad,
      }),
    ),
    transactions: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-transactions:${householdId}`,
        database,
        table: powerSyncTransactions,
        schema: powerSyncTransactionRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Transaction row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad,
      }),
    ),
    rejectedChanges: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-rejected-changes:${householdId}`,
        database,
        table: rejectedChanges,
        schema: powerSyncRejectedChangeRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid rejected change row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
      }),
    ),
  };
};
