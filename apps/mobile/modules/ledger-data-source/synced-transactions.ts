import type { CommandEnvelope } from "@trove/protocol";

import type { TransactionQueryFilters } from "@/modules/ledger-cache";
import type { TransactionWithDetails } from "@/types";
import { monthBounds, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";

import type { LedgerDataSourceOperation, LedgerTransactionResource } from "./contract";
import {
  mapSyncedAccount,
  mapSyncedCategory,
  mapSyncedTransaction,
  type SyncedTransaction,
} from "./synced-mappers";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

interface SyncedTransactionDependencies {
  householdId: string;
  readSnapshot: () => Promise<SyncedTransactionSnapshot>;
  readCachedSnapshot: () => Promise<SyncedTransactionSnapshot>;
  executeCommand: (operation: LedgerDataSourceOperation, command: CommandEnvelope) => Promise<void>;
}

export const createSyncedTransactionResource = ({
  householdId,
  readSnapshot,
  readCachedSnapshot,
  executeCommand,
}: SyncedTransactionDependencies): LedgerTransactionResource => {
  const list: LedgerTransactionResource["list"] = async (filters) => {
    const snapshot = await readSnapshot();
    const accounts = snapshot.accounts.map(mapSyncedAccount);
    const categories = snapshot.categories.map(mapSyncedCategory);
    const { start, end } =
      filters.year && filters.month ? monthBounds(filters.year, filters.month) : {};
    const matchesFilters = buildTransactionFilter(filters, start, end);
    const rows = snapshot.transactions
      .filter(matchesFilters)
      .map((transaction) => mapSyncedTransaction(transaction, accounts, categories))
      .sort((left, right) => {
        const dateOrder = left.date.localeCompare(right.date);
        if (dateOrder !== 0) return filters.sort === "asc" ? dateOrder : -dateOrder;
        return right.id.localeCompare(left.id);
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
    page: async ({ limit, beforeDate, beforeId }) => {
      const transactions = (await list({})).filter((transaction) => {
        if (!beforeDate) return true;
        if (transaction.date < beforeDate) return true;
        return transaction.date === beforeDate && Boolean(beforeId && transaction.id < beforeId);
      });
      const page = transactions.slice(0, limit);
      const hasMore = transactions.length > limit;
      const last = page.at(-1);
      return {
        transactions: page,
        hasMore,
        nextCursor: hasMore && last ? { date: last.date, id: last.id } : null,
      };
    },
    create: async (data) => {
      const id = generateId();
      await executeCommand("mutation.transaction-create", {
        commandId: generateId(),
        householdId,
        kind: "transaction.create",
        issuedAt: new Date().toISOString(),
        payload: {
          id,
          type: data.type,
          amountMinor: data.amount,
          date: data.date,
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
    update: async (id, data) => {
      const expectedVersion = await findCachedVersion(readCachedSnapshot, id);
      return executeCommand("mutation.transaction-update", {
        commandId: generateId(),
        householdId,
        kind: "transaction.edit",
        issuedAt: new Date().toISOString(),
        payload: {
          transactionId: id,
          ...(data.type !== undefined && { type: data.type }),
          ...(data.amount !== undefined && { amountMinor: data.amount }),
          ...(data.date !== undefined && {
            date: data.date instanceof Date ? toDateString(data.date) : data.date,
          }),
          ...(data.accountId !== undefined && { accountId: data.accountId }),
          ...(data.toAccountId !== undefined && { toAccountId: data.toAccountId }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.description !== undefined && { description: data.description }),
        },
        preconditions: [{ entityId: id, expectedVersion }],
      });
    },
    delete: async (id) => {
      const expectedVersion = await findCachedVersion(readCachedSnapshot, id);
      return executeCommand("mutation.transaction-delete", {
        commandId: generateId(),
        householdId,
        kind: "transaction.remove",
        issuedAt: new Date().toISOString(),
        payload: { transactionId: id },
        preconditions: [{ entityId: id, expectedVersion }],
      });
    },
    recordCardPayment: async () => {
      throw new Error("Card payments need the budget cutover before they can be recorded.");
    },
    linkRefund: async (data) => {
      const transactionId = generateId();
      await executeCommand("mutation.refund-link", {
        commandId: generateId(),
        householdId,
        kind: "refund.link",
        issuedAt: new Date().toISOString(),
        payload: { transactionId, ...data },
      });
      return transactionId;
    },
  };
};

const buildTransactionFilter = (
  filters: TransactionQueryFilters,
  start?: string,
  end?: string,
): ((transaction: SyncedTransaction) => boolean) => {
  const predicates: ((transaction: SyncedTransaction) => boolean)[] = [];
  if (start) predicates.push((transaction) => transaction.date >= start);
  if (end) predicates.push((transaction) => transaction.date <= end);
  if (filters.accountId) {
    predicates.push(
      (transaction) =>
        transaction.accountId === filters.accountId ||
        transaction.toAccountId === filters.accountId,
    );
  }
  if (filters.categoryId) {
    predicates.push((transaction) => transaction.categoryId === filters.categoryId);
  }
  if (filters.type) predicates.push((transaction) => transaction.type === filters.type);
  if (filters.isRecurring !== undefined) {
    predicates.push((transaction) => transaction.isRecurring === filters.isRecurring);
  }
  const startsOnOrAfter = filters.startsOnOrAfter;
  if (startsOnOrAfter) {
    predicates.push((transaction) => transaction.date >= startsOnOrAfter);
  }
  return (transaction) => predicates.every((predicate) => predicate(transaction));
};

const findCachedVersion = async (
  readSnapshot: () => Promise<SyncedTransactionSnapshot>,
  transactionId: string,
): Promise<number> => {
  const transaction = (await readSnapshot()).transactions.find(({ id }) => id === transactionId);
  if (!transaction) {
    throw new Error(
      "This Transaction is not in the authorized ledger snapshot. Refresh the ledger before editing it.",
    );
  }
  return transaction.version;
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
