import { aliasedTable, and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { isDate } from "date-fns";

import { accounts, categories, transactions } from "@/db/schema";
import { hasVisibleAccount } from "@/hooks/use-account-visibility";
import { monthBounds, nowIso, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { Transaction, TransactionWithDetails } from "@/types";
import type { TransactionQueryFilters } from "@/modules/ledger-cache";

import type { LedgerOperationRunner } from "./contract";
import type { LocalDatabaseDependency, LocalVisibilityDependency } from "./local-types";

const toAccounts = aliasedTable(accounts, "to_accounts");

const enrichedSelect = {
  id: transactions.id,
  type: transactions.type,
  amount: transactions.amount,
  currency: transactions.currency,
  originalAmount: transactions.originalAmount,
  originalCurrency: transactions.originalCurrency,
  exchangeRate: transactions.exchangeRate,
  date: transactions.date,
  accountId: transactions.accountId,
  toAccountId: transactions.toAccountId,
  categoryId: transactions.categoryId,
  isRecurring: transactions.isRecurring,
  recurringRuleId: transactions.recurringRuleId,
  description: transactions.description,
  createdAt: transactions.createdAt,
  updatedAt: transactions.updatedAt,
  accountName: accounts.name,
  accountColor: accounts.color,
  accountIcon: accounts.icon,
  accountCurrency: accounts.currency,
  toAccountName: toAccounts.name,
  toAccountColor: toAccounts.color,
  toAccountIcon: toAccounts.icon,
  toAccountCurrency: toAccounts.currency,
  categoryName: categories.name,
  categoryColor: categories.color,
  categoryIcon: categories.icon,
};

type EnrichedRow = Record<keyof typeof enrichedSelect, string | number | boolean | null>;

const mapRowToTransaction = (row: EnrichedRow): TransactionWithDetails => ({
  id: row.id as string,
  type: row.type as Transaction["type"],
  amount: row.amount as number,
  currency: row.currency as string,
  originalAmount: row.originalAmount as number | null,
  originalCurrency: row.originalCurrency as string | null,
  exchangeRate: row.exchangeRate as number | null,
  date: row.date as string,
  accountId: row.accountId as string,
  toAccountId: row.toAccountId as string | null,
  categoryId: row.categoryId as string | null,
  isRecurring: row.isRecurring as boolean,
  recurringRuleId: row.recurringRuleId as string | null,
  description: row.description as string,
  createdAt: row.createdAt as string,
  updatedAt: row.updatedAt as string,
  account: row.accountName
    ? {
        id: row.accountId as string,
        name: row.accountName as string,
        color: row.accountColor as string,
        icon: row.accountIcon as string,
        currency: row.accountCurrency as string,
      }
    : {
        id: row.accountId as string,
        name: "Unknown",
        color: "#ccc",
        icon: "banknote.fill",
        currency: "USD",
      },
  toAccount:
    row.toAccountId && row.toAccountName
      ? {
          id: row.toAccountId as string,
          name: row.toAccountName as string,
          color: row.toAccountColor as string,
          icon: row.toAccountIcon as string,
          currency: row.toAccountCurrency as string,
        }
      : null,
  category:
    row.categoryId && row.categoryName
      ? {
          id: row.categoryId as string,
          name: row.categoryName as string,
          color: row.categoryColor as string,
          icon: row.categoryIcon as string,
        }
      : null,
});

type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt" | "isRecurring"> & {
  isRecurring?: boolean;
};
type TransactionUpdate = Partial<
  Omit<Transaction, "id" | "createdAt" | "date"> & { date?: Date | string }
>;

export const createLocalTransactionPort = (
  { db, visibility }: LocalDatabaseDependency & LocalVisibilityDependency,
  runner: LedgerOperationRunner,
) => {
  const isVisible = (row: { accountId: string; toAccountId: string | null }) =>
    hasVisibleAccount(visibility, row.accountId) &&
    (row.toAccountId === null || hasVisibleAccount(visibility, row.toAccountId));

  const enrichedBaseQuery = () =>
    db
      .select(enrichedSelect)
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(toAccounts, eq(transactions.toAccountId, toAccounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id));

  return {
    reads: {
      transactions: (filters: TransactionQueryFilters) =>
        runner.run("read.transactions", async () => {
          const conditions = [];
          if (filters.year && filters.month) {
            const { start, end } = monthBounds(filters.year, filters.month);
            conditions.push(gte(transactions.date, start), lte(transactions.date, end));
          }
          if (filters.accountId) {
            conditions.push(
              sql`(${transactions.accountId} = ${filters.accountId} OR ${transactions.toAccountId} = ${filters.accountId})`,
            );
          }
          if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
          if (filters.type) conditions.push(eq(transactions.type, filters.type));
          if (filters.isRecurring !== undefined) {
            conditions.push(eq(transactions.isRecurring, filters.isRecurring));
          }
          if (filters.startsOnOrAfter) {
            conditions.push(gte(transactions.date, filters.startsOnOrAfter));
          }

          let query = enrichedBaseQuery()
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(
              filters.sort === "asc" ? asc(transactions.date) : desc(transactions.date),
              desc(transactions.createdAt),
            );
          if (filters.limit) query = query.limit(filters.limit) as typeof query;
          const rows = await query.all();
          return (rows as unknown as EnrichedRow[]).map(mapRowToTransaction).filter(isVisible);
        }),
      transaction: (id: string) =>
        runner.run("read.transaction", async () => {
          const row = await enrichedBaseQuery().where(eq(transactions.id, id)).get();
          if (!row) return undefined;
          const mapped = mapRowToTransaction(row as unknown as EnrichedRow);
          return isVisible(mapped) ? mapped : undefined;
        }),
      dateRange: () =>
        runner.run("read.transaction-date-range", async () => {
          const rows = (await db
            .select({
              accountId: transactions.accountId,
              date: transactions.date,
              toAccountId: transactions.toAccountId,
            })
            .from(transactions)
            .all()) as { accountId: string; date: string; toAccountId: string | null }[];
          const dates = rows
            .filter(isVisible)
            .map((row) => row.date)
            .sort();
          return { minDate: dates[0] ?? null, maxDate: dates.at(-1) ?? null };
        }),
      monthSummary: (year: number, month: number, accountId?: string | null) =>
        runner.run("read.month-summary", async () => {
          const { start, end } = monthBounds(year, month);
          const conditions = [gte(transactions.date, start), lte(transactions.date, end)];
          if (accountId) {
            conditions.push(
              sql`(${transactions.accountId} = ${accountId} OR ${transactions.toAccountId} = ${accountId})`,
            );
          }
          const rows = (await db
            .select()
            .from(transactions)
            .where(and(...conditions))
            .all()) as Transaction[];
          let totalIncome = 0;
          let totalExpense = 0;
          for (const transaction of rows.filter(isVisible)) {
            if (transaction.type === "income") totalIncome += transaction.amount;
            else if (transaction.type === "expense") totalExpense += transaction.amount;
          }
          return { totalIncome, totalExpense, netAmount: totalIncome - totalExpense };
        }),
    },
    mutations: {
      createTransaction: (data: NewTransaction) =>
        runner.run("mutation.transaction-create", async () => {
          const now = nowIso();
          const id = generateId();
          const date = isDate(data.date) ? toDateString(data.date as unknown as Date) : data.date;
          await db.insert(transactions).values({
            ...data,
            isRecurring: data.isRecurring ?? false,
            date,
            id,
            createdAt: now,
            updatedAt: now,
          });
          return id;
        }),
      updateTransaction: (id: string, data: TransactionUpdate) =>
        runner.run("mutation.transaction-update", async () => {
          await db
            .update(transactions)
            .set({
              ...data,
              date: isDate(data.date) ? toDateString(data.date as unknown as Date) : data.date,
              updatedAt: nowIso(),
            })
            .where(eq(transactions.id, id));
        }),
      deleteTransaction: (id: string) =>
        runner.run("mutation.transaction-delete", async () => {
          await db.delete(transactions).where(eq(transactions.id, id));
        }),
    },
  };
};
