import { createContext, useContext, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import type { Collection, UtilsRecord } from "@tanstack/db";
import { keepPreviousData, useQueries, useQuery, type QueryClient } from "@tanstack/react-query";

import type {
  V2Account,
  V2AssignmentsCreateInput,
  V2BudgetActivateInput,
  V2BudgetPeriodView,
  V2BudgetSetupFacts,
  V2BudgetUpdateInput,
  V2BudgetView,
  V2Category,
  V2EnvelopeCreateInput,
  V2EnvelopeUpdateInput,
  V2DueList,
  V2Home,
  V2PaydayRule,
  V2RecurringPayInput,
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
import { ApiError } from "./http";
import { createRequestKeyRunner } from "./request-keys";
import { transactionListKey } from "./transaction-list-keys";
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

export function useLedgerData(): LedgerDataContextValue {
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

export interface BudgetQueryResult<T> {
  readonly data: T | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  /** The data belongs to the previous input while the new one loads. */
  readonly isStale: boolean;
  readonly retry: () => Promise<void>;
}

/** Prefix of every Budget query for one ledger scope, so one invalidation refreshes them all. */
export const budgetKey = (identityKey: string, scope: LedgerScope) =>
  ["v2", "budget", scopeKey(identityKey, scope)] as const;

export function useBudgetQuery(): BudgetQueryResult<V2BudgetView> {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: [...budgetKey(identityKey, scope), "view"],
    queryFn: () => ledgerClient.budget.get(scope),
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isStale: false,
    retry: async () => {
      await query.refetch();
    },
  };
}

/** AED facts for the period `payday` implies; idle until a payday is chosen. */
export function useBudgetSetupFactsQuery(
  payday: V2PaydayRule | null,
): BudgetQueryResult<V2BudgetSetupFacts> {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: [...budgetKey(identityKey, scope), "setup-facts", payday],
    queryFn: () => ledgerClient.budget.setupFacts(scope, payday ?? { kind: "last_workday" }),
    enabled: payday !== null,
    // Keep the previous period's facts on screen while a changed payday loads.
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data,
    isLoading: query.isLoading && payday !== null,
    isError: query.isError,
    isStale: query.isPlaceholderData,
    retry: async () => {
      await query.refetch();
    },
  };
}

export interface BudgetPeriodsResult {
  /** In `starts` order: `undefined` while loading, `null` when the server has no such period. */
  readonly periods: readonly (V2BudgetPeriodView | null | undefined)[];
  readonly isLoading: boolean;
}

/** Per-envelope totals for earlier periods. */
export function useBudgetPeriodsQuery(starts: readonly string[]): BudgetPeriodsResult {
  const { identityKey, scope } = useLedgerData();
  const results = useQueries({
    queries: starts.map((start) => ({
      queryKey: [...budgetKey(identityKey, scope), "period", start],
      queryFn: () => ledgerClient.budget.period(scope, start),
      // Finished periods only change when a past transaction is edited.
      staleTime: 60_000,
      retry: false,
    })),
  });
  return {
    periods: results.map((result) => (result.isError ? null : result.data)),
    isLoading: results.some((result) => result.isLoading),
  };
}

/**
 * Reminder-mode bills pending through `through` (a Ledger Date). Lives under the Budget key
 * prefix, so every ledger write refreshes it with the rest of the Budget.
 */
export function useDueQuery(through: string): BudgetQueryResult<V2DueList> {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: [...budgetKey(identityKey, scope), "due", through],
    queryFn: () => ledgerClient.recurring.due(scope, through),
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isStale: false,
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
  const refresh = async (kind: keyof LedgerCollections | "home" | "budget") => {
    const refreshes: Promise<unknown>[] = [];
    // Activation creates the "My money" account and Categories, so it reloads both.
    if (kind === "accounts" || kind === "home" || kind === "budget")
      refreshes.push(collections.accounts.utils.refetch());
    if (kind === "categories" || kind === "home" || kind === "budget")
      refreshes.push(collections.categories.utils.refetch());
    if (kind === "transactions" || kind === "home")
      refreshes.push(collections.transactions.utils.refetch());
    if (kind === "recurring" || kind === "home")
      refreshes.push(collections.recurring.utils.refetch());
    await Promise.all(refreshes);
    if (kind === "accounts" || kind === "transactions" || kind === "home" || kind === "budget") {
      await queryClient.invalidateQueries({
        queryKey: ["v2", "home", scopeKey(identityKey, scope)],
      });
    }
    // Every ledger write can move Safe to spend and Not planned yet.
    await queryClient.invalidateQueries({ queryKey: budgetKey(identityKey, scope) });
    await queryClient.invalidateQueries({
      queryKey: ["v2", "upcoming", scopeKey(identityKey, scope)],
    });
    // Paged lists embed Account/Category references, and deletes cascade into them.
    await queryClient.invalidateQueries({ queryKey: transactionListKey(identityKey, scope) });
  };

  /** Envelope and assignment writes answer with the fresh budget, so show it without a refetch. */
  const applyBudgetView = async (view: V2BudgetView) => {
    queryClient.setQueryData([...budgetKey(identityKey, scope), "view"], view);
    // Earlier-period totals can move too (a plan is per period); they refetch when next shown.
    await queryClient.invalidateQueries({ queryKey: [...budgetKey(identityKey, scope), "period"] });
  };

  /** Paying posts a Transaction, so it refreshes Transactions, Accounts, the Due list and the Budget. */
  const refreshAfterOccurrence = async () => {
    await refresh("transactions");
    await refresh("accounts");
    await refresh("recurring");
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
    payOccurrence: async (ruleId: string, date: string, input: V2RecurringPayInput) => {
      return runWithRequestKey(
        "recurring.pay",
        fingerprint(JSON.stringify([ruleId, date, input]) ?? ""),
        async (requestKey) => {
          try {
            const result = await ledgerClient.recurring.pay(scope, ruleId, date, input, {
              requestKey,
            });
            await refreshAfterOccurrence();
            return result;
          } catch (error) {
            // 409: already paid or skipped elsewhere, so the list on screen is stale.
            if (error instanceof ApiError && error.status === 409) {
              await refreshAfterOccurrence().catch(() => undefined);
            }
            throw error;
          }
        },
      );
    },
    skipOccurrence: async (ruleId: string, date: string) => {
      return runWithRequestKey(
        "recurring.skip",
        fingerprint(JSON.stringify([ruleId, date]) ?? ""),
        async (requestKey) => {
          try {
            const result = await ledgerClient.recurring.skip(scope, ruleId, date, { requestKey });
            await refreshAfterOccurrence();
            return result;
          } catch (error) {
            // 409: already paid or skipped elsewhere, so the list on screen is stale.
            if (error instanceof ApiError && error.status === 409) {
              await refreshAfterOccurrence().catch(() => undefined);
            }
            throw error;
          }
        },
      );
    },
    activateBudget: async (input: V2BudgetActivateInput) => {
      return runWithRequestKey(
        "budget.activate",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.budget.activate(scope, input, { requestKey });
          await refresh("budget");
          return result;
        },
      );
    },
    createEnvelope: async (input: V2EnvelopeCreateInput) => {
      return runWithRequestKey(
        "budget.createEnvelope",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.budget.createEnvelope(scope, input, { requestKey });
          // A new Category may have been created with it.
          await refresh("budget");
          return result;
        },
      );
    },
    updateEnvelope: async (id: string, input: V2EnvelopeUpdateInput, version?: number) => {
      return runWithRequestKey(
        "budget.updateEnvelope",
        fingerprint(JSON.stringify([id, input, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.budget.updateEnvelope(scope, id, input, {
            version,
            requestKey,
          });
          await applyBudgetView(result);
          return result;
        },
      );
    },
    createAssignments: async (input: V2AssignmentsCreateInput) => {
      return runWithRequestKey(
        "budget.createAssignments",
        fingerprint(JSON.stringify(input) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.budget.createAssignments(scope, input, { requestKey });
          await applyBudgetView(result);
          return result;
        },
      );
    },
    updateBudget: async (input: V2BudgetUpdateInput, version?: number) => {
      return runWithRequestKey(
        "budget.update",
        fingerprint(JSON.stringify([input, version]) ?? ""),
        async (requestKey) => {
          const result = await ledgerClient.budget.update(scope, input, { version, requestKey });
          await refresh("budget");
          return result;
        },
      );
    },
  };
}
