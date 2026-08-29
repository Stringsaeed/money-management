import type { orpc } from "@/lib/server/orpc";
import type { Account, Category, TransactionWithDetails } from "@/types";

import {
  unsupportedSyncedOperation,
  type AccountUpdate,
  type NewAccount,
  type TransactionUpdate,
} from "./contract";

type WireTimestamp = Date | string;
type AccountRow = Awaited<ReturnType<typeof orpc.ledger.accounts.list>>[number];
type CategoryRow = Awaited<ReturnType<typeof orpc.ledger.categories.list>>[number];
type TransactionResponse = Awaited<ReturnType<typeof orpc.ledger.transactions.list>>;
type TransactionRow = TransactionResponse["transactions"][number];

export type SyncedAccount = Omit<AccountRow, "createdAt" | "updatedAt" | "lifecycleChangedAt"> & {
  createdAt: WireTimestamp;
  updatedAt: WireTimestamp;
  lifecycleChangedAt: WireTimestamp | null;
};
export type SyncedCategory = Omit<CategoryRow, "createdAt" | "updatedAt" | "lifecycleChangedAt"> & {
  createdAt: WireTimestamp;
  updatedAt: WireTimestamp;
  lifecycleChangedAt: WireTimestamp | null;
};
export type SyncedTransaction = Omit<TransactionRow, "createdAt" | "updatedAt"> & {
  createdAt: WireTimestamp;
  updatedAt: WireTimestamp;
};
export type SyncedTransactionPage = Omit<TransactionResponse, "transactions"> & {
  transactions: readonly SyncedTransaction[];
};

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
    throw unsupportedSyncedOperation(
      "Account type, currency, or opening balance edit",
      "Those fields remain unchanged.",
      "Edit only the Account name, color, icon, total visibility, or sort order.",
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
    throw unsupportedSyncedOperation(
      "This Transaction edit",
      "Unsupported fields remain unchanged.",
      "Edit only type, amount, date, Account, Category, or description.",
    );
  }
};
