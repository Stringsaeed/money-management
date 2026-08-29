import { useSQLiteContext } from "expo-sqlite";

import { useDatabase } from "@/db/client";
import { useAccountVisibility } from "@/hooks/use-account-visibility";

import {
  createLedgerOperationRunner,
  type LedgerAccountDataSource,
  type LedgerCategoryDataSource,
  type LedgerTransactionDataSource,
} from "./contract";
import { createLocalAccountPort } from "./local-accounts";
import { createLocalCategoryPort } from "./local-categories";
import { createLocalTransactionPort } from "./local-transactions";

export const useLocalAccountDataSource = () => {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const visibility = useAccountVisibility();
  const runner = createLedgerOperationRunner("local");
  const port = createLocalAccountPort({ db, sqlite, visibility }, runner);
  return {
    source: "local",
    cacheKey: visibility.cacheKey,
    offlineState: { kind: "offline_ready" },
    accounts: {
      list: port.reads.accounts,
      get: port.reads.account,
      listWithBalances: port.reads.accountBalances,
      create: port.mutations.createAccount,
      update: port.mutations.updateAccount,
      archive: port.mutations.archiveAccount,
    },
    accountLifecycle: {
      kind: "local",
      archivalPreview: port.reads.archivalPreview,
      deletionPreview: port.reads.deletionPreview,
      restore: port.mutations.restoreAccount,
      delete: port.mutations.deleteAccount,
    },
    observeErrors: runner.observeErrors,
  } satisfies LedgerAccountDataSource;
};

export const useLocalCategoryDataSource = () => {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const runner = createLedgerOperationRunner("local");
  const port = createLocalCategoryPort({ db, sqlite }, runner);
  return {
    source: "local",
    cacheKey: "local-only",
    offlineState: { kind: "offline_ready" },
    categories: {
      list: async (type, includeArchived = false) =>
        includeArchived ? port.reads.allCategories() : port.reads.categories(type),
      get: port.reads.category,
      create: port.mutations.createCategory,
      update: port.mutations.updateCategory,
      archive: port.mutations.archiveCategory,
    },
    categoryLifecycle: {
      kind: "local",
      deletionPreview: port.reads.deletionPreview,
      restore: port.mutations.restoreCategory,
      delete: port.mutations.deleteCategory,
    },
    observeErrors: runner.observeErrors,
  } satisfies LedgerCategoryDataSource;
};

export const useLocalTransactionDataSource = () => {
  const db = useDatabase();
  const visibility = useAccountVisibility();
  const runner = createLedgerOperationRunner("local");
  const port = createLocalTransactionPort({ db, visibility }, runner);
  return {
    source: "local",
    cacheKey: visibility.cacheKey,
    offlineState: { kind: "offline_ready" },
    transactions: {
      list: port.reads.transactions,
      get: port.reads.transaction,
      dateRange: port.reads.dateRange,
      monthSummary: port.reads.monthSummary,
      create: port.mutations.createTransaction,
      update: port.mutations.updateTransaction,
      delete: port.mutations.deleteTransaction,
    },
    observeErrors: runner.observeErrors,
  } satisfies LedgerTransactionDataSource;
};
