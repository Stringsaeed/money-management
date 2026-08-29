import type { orpc } from "@/lib/server/orpc";
import type { Account, Category, TransactionWithDetails } from "@/types";

import type { AccountUpdate, NewAccount, TransactionUpdate } from "./contract";

export type SyncedAccount = Awaited<ReturnType<typeof orpc.ledger.accounts.list>>[number];
export type SyncedCategory = Awaited<ReturnType<typeof orpc.ledger.categories.list>>[number];
export type SyncedTransactionPage = Awaited<ReturnType<typeof orpc.ledger.transactions.list>>;
export type SyncedTransaction = SyncedTransactionPage["transactions"][number];

const toIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

export const mapSyncedAccount = (row: SyncedAccount): Account => ({
  id: row.id,
  name: row.name,
  type: row.type === "card" ? "credit_card" : row.type === "bank" ? "checking" : "cash",
  currency: row.currency,
  color: row.color,
  icon: row.icon,
  initialBalance: row.initialBalanceMinor,
  excludeFromTotal: row.excludeFromTotal,
  sortOrder: row.sortOrder,
  lifecycle: row.lifecycle,
  lifecycleChangedAt: row.lifecycleChangedAt ? toIso(row.lifecycleChangedAt) : null,
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
});

export const mapSyncedCategory = (row: SyncedCategory): Category => ({
  id: row.id,
  name: row.name,
  type: row.type,
  color: row.color,
  icon: row.icon,
  parentId: row.parentId,
  sortOrder: row.sortOrder,
  lifecycle: row.lifecycle,
  lifecycleChangedAt: row.lifecycleChangedAt ? toIso(row.lifecycleChangedAt) : null,
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
});

export const mapSyncedTransaction = (
  row: SyncedTransaction,
  accounts: readonly Account[],
  categories: readonly Category[],
): TransactionWithDetails => {
  const account = accounts.find((candidate) => candidate.id === row.accountId);
  const toAccount = accounts.find((candidate) => candidate.id === row.toAccountId);
  const category = categories.find((candidate) => candidate.id === row.categoryId);
  return {
    id: row.id,
    type: row.type,
    amount: row.amountMinor,
    currency: row.currency,
    originalAmount: row.originalAmountMinor,
    originalCurrency: row.originalCurrency,
    exchangeRate: row.exchangeRate,
    date: row.date,
    accountId: row.accountId,
    toAccountId: row.toAccountId,
    categoryId: row.categoryId,
    isRecurring: row.isRecurring,
    recurringRuleId: row.recurringRuleId,
    description: row.description,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    account: account
      ? pickAccount(account)
      : {
          id: row.accountId,
          name: "Unknown",
          color: "#ccc",
          icon: "banknote.fill",
          currency: row.currency,
        },
    toAccount: toAccount ? pickAccount(toAccount) : null,
    category: category
      ? { id: category.id, name: category.name, color: category.color, icon: category.icon }
      : null,
  };
};

const pickAccount = (account: Account): TransactionWithDetails["account"] => ({
  id: account.id,
  name: account.name,
  color: account.color,
  icon: account.icon,
  currency: account.currency,
});

export const calculateSyncedBalance = (
  account: Account,
  transactions: readonly SyncedTransaction[],
): number => {
  let balance = account.initialBalance;
  for (const transaction of transactions) {
    if (transaction.accountId === account.id) {
      balance += transaction.type === "income" ? transaction.amountMinor : -transaction.amountMinor;
    }
    if (transaction.type === "transfer" && transaction.toAccountId === account.id) {
      balance += transaction.amountMinor;
    }
  }
  return balance;
};

export const toSyncedAccountType = (type: NewAccount["type"]): "cash" | "bank" | "card" => {
  if (type === "cash") return "cash";
  if (type === "credit_card") return "card";
  return "bank";
};

export const assertSupportedAccountUpdate = (data: AccountUpdate): void => {
  if (data.type !== undefined || data.currency !== undefined || data.initialBalance !== undefined) {
    throw new Error(
      "Synced Account type, currency, and opening balance edits are not available yet.",
    );
  }
};

export const assertSupportedTransactionUpdate = (data: TransactionUpdate): void => {
  if (
    data.currency !== undefined ||
    data.originalAmount !== undefined ||
    data.originalCurrency !== undefined ||
    data.exchangeRate !== undefined ||
    data.isRecurring !== undefined ||
    data.recurringRuleId !== undefined
  ) {
    throw new Error("This synced Transaction edit is not available yet.");
  }
};
