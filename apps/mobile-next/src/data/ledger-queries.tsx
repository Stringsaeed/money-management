import { createContext, useContext, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import type { Collection, UtilsRecord } from "@tanstack/db";
import { useQuery, type QueryClient } from "@tanstack/react-query";

import type {
  V2Account,
  V2Category,
  V2Home,
  V2RecurringRule,
  V2Transaction,
} from "@trove/api/v2/contracts";

import {
  ledgerClient,
  type AccountInput,
  type AccountUpdateInput,
  type CategoryInput,
  type CategoryUpdateInput,
  type LedgerScope,
  type RecurringRuleInput,
  type TransactionInput,
} from "./ledger-client";
import { createLedgerCollections, scopeKey, type LedgerCollections } from "./ledger-collections";
import { parseHome, type UpcomingOccurrence } from "./ledger-schemas";
import { createRequestKeyRunner } from "./request-keys";
import { changeRecurringLifecycle } from "./recurring-lifecycle";

interface LedgerDataContextValue {
  readonly identityKey: string;
  readonly queryClient: QueryClient;
  readonly scope: LedgerScope;
  readonly collections: LedgerCollections;
}

const LedgerDataContext = createContext<LedgerDataContextValue | null>(null);

export interface LedgerDataProviderProps {
  readonly children: React.ReactNode;
  readonly identityKey: string;
  readonly queryClient: QueryClient;
  readonly scope: LedgerScope;
}

export function LedgerDataProvider({
  children,
  identityKey,
  queryClient,
  scope,
}: LedgerDataProviderProps) {
  const [collections] = useState(() => createLedgerCollections(queryClient, identityKey, scope));

  const value: LedgerDataContextValue = { identityKey, queryClient, scope, collections };

  return <LedgerDataContext.Provider value={value}>{children}</LedgerDataContext.Provider>;
}

function useLedgerData(): LedgerDataContextValue {
  const value = useContext(LedgerDataContext);
  if (!value) throw new Error("LedgerDataProvider is required for ledger features.");
  return value;
}

export interface LedgerQueryResult<T> {
  readonly data: readonly T[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly retry: () => Promise<void>;
}

export interface HomeQueryResult {
  readonly data: V2Home | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly retry: () => Promise<void>;
}

function useCollectionRows<T extends object>(
  collection: Collection<T, string, UtilsRecord, never, T>,
): LedgerQueryResult<T> {
  const result = useLiveQuery({ query: (query) => query.from({ rows: collection }) });
  const rows = result.data ?? [];
  const retry = async () => {
    await collection.utils.refetch();
  };
  return {
    data: rows,
    isLoading: result.isLoading,
    isError: result.isError,
    error:
      collection.utils.lastError instanceof Error
        ? collection.utils.lastError
        : collection.utils.lastError
          ? new Error(String(collection.utils.lastError))
          : null,
    retry,
  };
}

export function useAccountsQuery(): LedgerQueryResult<V2Account> {
  const { collections } = useLedgerData();
  return useCollectionRows<V2Account>(collections.accounts);
}

export function useCategoriesQuery(): LedgerQueryResult<V2Category> {
  const { collections } = useLedgerData();
  return useCollectionRows<V2Category>(collections.categories);
}

export interface TransactionFilters {
  readonly accountId?: string | null;
  readonly categoryId?: string | null;
  readonly kind?: V2Transaction["kind"] | null;
  readonly fromDate?: string | null;
  readonly toDate?: string | null;
}

// oxlint-disable-next-line complexity -- filters are independent and each maps to one query predicate.
export function useTransactionsQuery(
  filters: TransactionFilters = {},
): LedgerQueryResult<V2Transaction> {
  const { collections } = useLedgerData();
  const result = useCollectionRows<V2Transaction>(collections.transactions);
  // oxlint-disable-next-line complexity -- each independent filter is user-selectable.
  const data = result.data.filter((transaction) => {
    if (
      filters.accountId &&
      transaction.accountId !== filters.accountId &&
      transaction.toAccountId !== filters.accountId
    )
      return false;
    if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
    if (filters.kind && transaction.kind !== filters.kind) return false;
    if (filters.fromDate && transaction.date < filters.fromDate) return false;
    if (filters.toDate && transaction.date > filters.toDate) return false;
    return true;
  });
  return { ...result, data };
}

export function useRecurringQuery(): LedgerQueryResult<V2RecurringRule> {
  const { collections } = useLedgerData();
  return useCollectionRows<V2RecurringRule>(collections.recurring);
}

export function useHomeQuery(): HomeQueryResult {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: ["v2", "home", scopeKey(identityKey, scope)],
    queryFn: async () => parseHome(await ledgerClient.home(scope)),
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error:
      query.error instanceof Error
        ? query.error
        : query.error
          ? new Error(String(query.error))
          : null,
    retry: async () => {
      await query.refetch();
    },
  };
}

export function useUpcomingQuery(): LedgerQueryResult<UpcomingOccurrence> {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: ["v2", "upcoming", scopeKey(identityKey, scope)],
    queryFn: () => ledgerClient.recurring.upcoming(scope),
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    retry: async () => {
      await query.refetch();
    },
  };
}

export function useLedgerMutations() {
  const { identityKey, queryClient, scope, collections } = useLedgerData();
  const [runWithRequestKey] = useState(createRequestKeyRunner);
  const fingerprint = (value: string): string => value;

  // oxlint-disable-next-line complexity -- refresh invalidates only the collections affected by a mutation.
  const refresh = async (kind: keyof LedgerCollections | "home") => {
    const refreshes: Promise<unknown>[] = [];
    if (kind === "accounts" || kind === "home")
      refreshes.push(collections.accounts.utils.refetch());
    if (kind === "categories" || kind === "home")
      refreshes.push(collections.categories.utils.refetch());
    if (kind === "transactions" || kind === "home")
      refreshes.push(collections.transactions.utils.refetch());
    if (kind === "recurring" || kind === "home")
      refreshes.push(collections.recurring.utils.refetch());
    await Promise.all(refreshes);
    if (kind === "accounts" || kind === "transactions" || kind === "home") {
      await queryClient.invalidateQueries({
        queryKey: ["v2", "home", scopeKey(identityKey, scope)],
      });
    }
    await queryClient.invalidateQueries({
      queryKey: ["v2", "upcoming", scopeKey(identityKey, scope)],
    });
  };

  return {
    createAccount: async (input: AccountInput) => {
      return runWithRequestKey(
        "accounts.create",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.accounts.create(scope, input, { requestKey });
          await refresh("accounts");
          return result;
        },
      );
    },
    updateAccount: async (id: string, input: AccountUpdateInput, version?: number) => {
      return runWithRequestKey(
        "accounts.update",
        fingerprint(JSON.stringify([id, input, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.accounts.update(scope, id, input, {
            version,
            requestKey,
          });
          await refresh("accounts");
          return result;
        },
      );
    },
    archiveAccount: async (id: string, version?: number) => {
      return runWithRequestKey(
        "accounts.archive",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.accounts.archive(scope, id, version, requestKey);
          await refresh("accounts");
          return result;
        },
      );
    },
    restoreAccount: async (id: string, version?: number) => {
      return runWithRequestKey(
        "accounts.restore",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.accounts.restore(scope, id, version, requestKey);
          await refresh("accounts");
          return result;
        },
      );
    },
    deleteAccount: async (id: string, version?: number) => {
      await runWithRequestKey(
        "accounts.delete",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          await ledgerClient.accounts.remove(scope, id, version, requestKey);
          await refresh("home");
        },
      );
    },
    createCategory: async (input: CategoryInput) => {
      return runWithRequestKey(
        "categories.create",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.categories.create(scope, input, { requestKey });
          await refresh("categories");
          return result;
        },
      );
    },
    updateCategory: async (id: string, input: CategoryUpdateInput, version?: number) => {
      return runWithRequestKey(
        "categories.update",
        fingerprint(JSON.stringify([id, input, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.categories.update(scope, id, input, {
            version,
            requestKey,
          });
          await refresh("categories");
          return result;
        },
      );
    },
    archiveCategory: async (id: string, version?: number) => {
      return runWithRequestKey(
        "categories.archive",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.categories.archive(scope, id, version, requestKey);
          await refresh("categories");
          return result;
        },
      );
    },
    restoreCategory: async (id: string, version?: number) => {
      return runWithRequestKey(
        "categories.restore",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.categories.restore(scope, id, version, requestKey);
          await refresh("categories");
          return result;
        },
      );
    },
    deleteCategory: async (id: string, version?: number) => {
      await runWithRequestKey(
        "categories.delete",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          await ledgerClient.categories.remove(scope, id, version, requestKey);
          await refresh("home");
        },
      );
    },
    createTransaction: async (input: TransactionInput) => {
      return runWithRequestKey(
        "transactions.create",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.transactions.create(scope, input, { requestKey });
          await refresh("transactions");
          await refresh("accounts");
          return result;
        },
      );
    },
    updateTransaction: async (id: string, input: Partial<TransactionInput>, version?: number) => {
      return runWithRequestKey(
        "transactions.update",
        fingerprint(JSON.stringify([id, input, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.transactions.update(scope, id, input, {
            version,
            requestKey,
          });
          await refresh("transactions");
          await refresh("accounts");
          return result;
        },
      );
    },
    deleteTransaction: async (id: string, version?: number) => {
      await runWithRequestKey(
        "transactions.delete",
        fingerprint(JSON.stringify([id, version]) ?? ""),
        async (requestKey) => {
          await ledgerClient.transactions.remove(scope, id, version, requestKey);
          await refresh("transactions");
          await refresh("accounts");
        },
      );
    },
    changeRecurringLifecycle: async (
      id: string,
      observed: V2RecurringRule["lifecycle"],
      requested: "active" | "paused" | "archived",
    ) => {
      try {
        const result = await changeRecurringLifecycle(scope, id, observed, requested);
        await refresh("recurring");
        return result;
      } catch (error) {
        await refresh("recurring").catch(() => undefined);
        throw error;
      }
    },
    createRecurring: async (input: RecurringRuleInput) => {
      return runWithRequestKey(
        "recurring.create",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.recurring.create(scope, input, { requestKey });
          await refresh("recurring");
          return result;
        },
      );
    },
    updateRecurring: async (
      id: string,
      input: Partial<RecurringRuleInput> & { lifecycle?: V2RecurringRule["lifecycle"] },
      version?: number,
    ) => {
      return runWithRequestKey(
        "recurring.update",
        fingerprint(JSON.stringify([id, input, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.recurring.update(scope, id, input, {
            version,
            requestKey,
          });
          await refresh("recurring");
          return result;
        },
      );
    },
  };
}
