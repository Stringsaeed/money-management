import type { CommandEnvelope } from "@trove/protocol";
import { isDate } from "date-fns";

import { monthBounds, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { TransactionWithDetails } from "@/types";

import type { LedgerDataSourceOperation, LedgerTransactionResource } from "./contract";
import {
  assertSupportedTransactionUpdate,
  mapSyncedAccount,
  mapSyncedCategory,
  mapSyncedTransaction,
  type SyncedAccount,
  type SyncedCategory,
  type SyncedTransactionPage,
} from "./synced-mappers";

type ExecuteCommand = (
  operation: LedgerDataSourceOperation,
  command: CommandEnvelope,
) => Promise<unknown>;

interface SyncedTransactionDependencies {
  householdId: string;
  listAccounts: () => Promise<readonly SyncedAccount[]>;
  listCategories: () => Promise<readonly SyncedCategory[]>;
  listAllTransactions: () => Promise<SyncedTransactionPage>;
  listTransactionPage: (options: {
    limit?: number;
    beforeDate?: string;
  }) => Promise<SyncedTransactionPage>;
  executeCommand: ExecuteCommand;
}

export const createSyncedTransactionResource = ({
  householdId,
  listAccounts,
  listCategories,
  listAllTransactions,
  listTransactionPage,
  executeCommand,
}: SyncedTransactionDependencies): LedgerTransactionResource => {
  const list: LedgerTransactionResource["list"] = async (filters) => {
    const [accountRows, categoryRows, page] = await Promise.all([
      listAccounts(),
      listCategories(),
      listAllTransactions(),
    ]);
    const accounts = accountRows.map(mapSyncedAccount);
    const categories = categoryRows.map(mapSyncedCategory);
    const { start, end } =
      filters.year && filters.month ? monthBounds(filters.year, filters.month) : {};
    const rows = page.transactions
      .filter((transaction) => {
        if (start && transaction.date < start) return false;
        if (end && transaction.date > end) return false;
        if (
          filters.accountId &&
          transaction.accountId !== filters.accountId &&
          transaction.toAccountId !== filters.accountId
        ) {
          return false;
        }
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        if (filters.type && transaction.type !== filters.type) return false;
        if (filters.isRecurring !== undefined && transaction.isRecurring !== filters.isRecurring) {
          return false;
        }
        return !filters.startsOnOrAfter || transaction.date >= filters.startsOnOrAfter;
      })
      .map((transaction) => mapSyncedTransaction(transaction, accounts, categories))
      .sort((left, right) => {
        const dateOrder = left.date.localeCompare(right.date);
        if (dateOrder !== 0) return filters.sort === "asc" ? dateOrder : -dateOrder;
        return right.createdAt.localeCompare(left.createdAt);
      });
    return filters.limit ? rows.slice(0, filters.limit) : rows;
  };

  return {
    list,
    get: async (id) => (await list({})).find((transaction) => transaction.id === id),
    dateRange: async () => {
      const transactions = await list({ sort: "asc" });
      return {
        minDate: transactions[0]?.date ?? null,
        maxDate: transactions.at(-1)?.date ?? null,
      };
    },
    monthSummary: async (year, month, accountId) =>
      summarize(await list({ year, month, accountId })),
    page: async ({ limit, beforeDate }) => {
      const [accountRows, categoryRows, page] = await Promise.all([
        listAccounts(),
        listCategories(),
        listTransactionPage({ limit, beforeDate }),
      ]);
      const accounts = accountRows.map(mapSyncedAccount);
      const categories = categoryRows.map(mapSyncedCategory);
      return {
        transactions: page.transactions.map((transaction) =>
          mapSyncedTransaction(transaction, accounts, categories),
        ),
        hasMore: page.hasMore,
      };
    },
    create: async (data) => {
      const id = generateId();
      const date = isDate(data.date) ? toDateString(data.date as unknown as Date) : data.date;
      await executeCommand("mutation.transaction-create", {
        commandId: generateId(),
        householdId,
        kind: "transaction.create",
        payload: {
          id,
          type: data.type,
          amountMinor: data.amount,
          date,
          accountId: data.accountId,
          toAccountId: data.toAccountId,
          categoryId: data.categoryId,
          description: data.description,
          originalAmountMinor: data.originalAmount,
          originalCurrency: data.originalCurrency,
          exchangeRate: data.exchangeRate,
          isRecurring: data.isRecurring ?? false,
        },
      });
      return id;
    },
    update: (id, data) => {
      assertSupportedTransactionUpdate(data);
      return executeCommand("mutation.transaction-update", {
        commandId: generateId(),
        householdId,
        kind: "transaction.edit",
        payload: {
          transactionId: id,
          ...(data.type !== undefined && { type: data.type }),
          ...(data.amount !== undefined && { amountMinor: data.amount }),
          ...(data.date !== undefined && {
            date: isDate(data.date) ? toDateString(data.date as unknown as Date) : data.date,
          }),
          ...(data.accountId !== undefined && { accountId: data.accountId }),
          ...(data.toAccountId !== undefined && { toAccountId: data.toAccountId }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });
    },
    delete: (id) =>
      executeCommand("mutation.transaction-delete", {
        commandId: generateId(),
        householdId,
        kind: "transaction.remove",
        payload: { transactionId: id },
      }),
  };
};

const summarize = (transactions: readonly TransactionWithDetails[]) => {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const transaction of transactions) {
    if (transaction.type === "income") totalIncome += transaction.amount;
    else if (transaction.type === "expense") totalExpense += transaction.amount;
  }
  return { totalIncome, totalExpense, netAmount: totalIncome - totalExpense };
};
