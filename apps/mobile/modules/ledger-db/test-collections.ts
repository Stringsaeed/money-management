import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";

import type { PowerSyncLedgerCollections } from "./collections";
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

export const createTestLedgerCollections = (initial?: {
  readonly accounts?: PowerSyncAccountRow[];
  readonly categories?: PowerSyncCategoryRow[];
  readonly transactions?: PowerSyncTransactionRow[];
  readonly rejectedChanges?: PowerSyncRejectedChangeRow[];
}): PowerSyncLedgerCollections => {
  const collections = {
    accounts: createCollection(
      localOnlyCollectionOptions({
        id: `test-accounts-${Math.random()}`,
        schema: powerSyncAccountRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.accounts ?? [],
      }),
    ),
    categories: createCollection(
      localOnlyCollectionOptions({
        id: `test-categories-${Math.random()}`,
        schema: powerSyncCategoryRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.categories ?? [],
      }),
    ),
    transactions: createCollection(
      localOnlyCollectionOptions({
        id: `test-transactions-${Math.random()}`,
        schema: powerSyncTransactionRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.transactions ?? [],
      }),
    ),
    rejectedChanges: createCollection(
      localOnlyCollectionOptions({
        id: `test-rejected-${Math.random()}`,
        schema: powerSyncRejectedChangeRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.rejectedChanges ?? [],
      }),
    ),
  };
  return collections;
};

export const preloadTestLedgerCollections = async (
  collections: PowerSyncLedgerCollections,
): Promise<void> => {
  await Promise.all([
    collections.accounts.preload(),
    collections.categories.preload(),
    collections.transactions.preload(),
    collections.rejectedChanges.preload(),
  ]);
};
