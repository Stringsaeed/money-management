import "@/data/crypto-polyfill";

import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { QueryClient } from "@tanstack/react-query";

import type {
  V2Account,
  V2Category,
  V2RecurringRule,
  V2Transaction,
} from "@trove/api/v2/contracts";

import { ledgerClient, type LedgerScope } from "./ledger-client";

export interface LedgerCollections {
  readonly accounts: ReturnType<typeof createAccountCollection>;
  readonly categories: ReturnType<typeof createCategoryCollection>;
  readonly transactions: ReturnType<typeof createTransactionCollection>;
  readonly recurring: ReturnType<typeof createRecurringCollection>;
}

export const scopeKey = (identityKey: string, scope: LedgerScope): string =>
  `${identityKey}:${scope.kind === "personal" ? "personal" : `household:${scope.householdId}`}`;

const createAccountCollection = (
  queryClient: QueryClient,
  identityKey: string,
  scope: LedgerScope,
) =>
  createCollection(
    queryCollectionOptions({
      id: `v2-accounts:${scopeKey(identityKey, scope)}`,
      queryKey: ["v2", "accounts", scopeKey(identityKey, scope)],
      queryClient,
      getKey: (account) => account.id,
      queryFn: async () =>
        fetchAll((options) =>
          ledgerClient.accounts.list(scope, { ...options, includeArchived: true }),
        ),
      staleTime: 30_000,
      retry: 1,
    }),
  );

const createCategoryCollection = (
  queryClient: QueryClient,
  identityKey: string,
  scope: LedgerScope,
) =>
  createCollection(
    queryCollectionOptions({
      id: `v2-categories:${scopeKey(identityKey, scope)}`,
      queryKey: ["v2", "categories", scopeKey(identityKey, scope)],
      queryClient,
      getKey: (category) => category.id,
      queryFn: async () =>
        fetchAll((options) =>
          ledgerClient.categories.list(scope, { ...options, includeArchived: true }),
        ),
      staleTime: 30_000,
      retry: 1,
    }),
  );

const createTransactionCollection = (
  queryClient: QueryClient,
  identityKey: string,
  scope: LedgerScope,
) =>
  createCollection(
    queryCollectionOptions({
      id: `v2-transactions:${scopeKey(identityKey, scope)}`,
      queryKey: ["v2", "transactions", scopeKey(identityKey, scope)],
      queryClient,
      getKey: (transaction) => transaction.id,
      queryFn: async () => fetchAll((options) => ledgerClient.transactions.list(scope, options)),
      staleTime: 15_000,
      retry: 1,
    }),
  );

const createRecurringCollection = (
  queryClient: QueryClient,
  identityKey: string,
  scope: LedgerScope,
) =>
  createCollection(
    queryCollectionOptions({
      id: `v2-recurring:${scopeKey(identityKey, scope)}`,
      queryKey: ["v2", "recurring", scopeKey(identityKey, scope)],
      queryClient,
      getKey: (rule) => rule.id,
      queryFn: async () =>
        fetchAll((options) =>
          ledgerClient.recurring.list(scope, { ...options, includeArchived: true }),
        ),
      staleTime: 30_000,
      retry: 1,
    }),
  );

export function createLedgerCollections(
  queryClient: QueryClient,
  identityKey: string,
  scope: LedgerScope,
): LedgerCollections {
  return {
    accounts: createAccountCollection(queryClient, identityKey, scope),
    categories: createCategoryCollection(queryClient, identityKey, scope),
    transactions: createTransactionCollection(queryClient, identityKey, scope),
    recurring: createRecurringCollection(queryClient, identityKey, scope),
  };
}

async function fetchAll<T>(
  load: (options: {
    limit: number;
    cursor?: string | null;
  }) => Promise<{ items: readonly T[]; nextCursor: string | null }>,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 100; page += 1) {
    const result = await load({ limit: 200, cursor });
    items.push(...result.items);
    if (!result.nextCursor) return items;
    cursor = result.nextCursor;
  }
  throw new Error("The ledger returned too many pages. Narrow the query and try again.");
}

export type AccountRow = V2Account;
export type CategoryRow = V2Category;
export type TransactionRow = V2Transaction;
export type RecurringRow = V2RecurringRule;
