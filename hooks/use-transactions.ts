import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aliasedTable, and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

import { useDatabase } from "@/db/client";
import { accounts, categories, transactions } from "@/db/schema";
import { generateId } from "@/utils/id";
import { nowIso, monthBounds, toDateString } from "@/utils/date";
import type { Transaction, TransactionWithDetails } from "@/types";
import { isDate } from "date-fns";

const toAccounts = aliasedTable(accounts, "to_accounts");

// ── Query keys ────────────────────────────────────────────────────────────────

const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", "list", filters] as const,
  recent: (limit: number) => ["transactions", "recent", limit] as const,
  detail: (id: string) => ["transactions", id] as const,
};

interface TransactionFilters {
  year?: number;
  month?: number; // 1-indexed
  accountId?: string | null;
  categoryId?: string | null;
  type?: Transaction["type"];
  isRecurring?: boolean;
  startsOnOrAfter?: string;
  sort?: "asc" | "desc";
  limit?: number;
}

// ── Helper: selected columns for joined query ────────────────────────────────

const enrichedSelect = {
  // Transaction columns
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
  recurringPaymentId: transactions.recurringPaymentId,
  description: transactions.description,
  createdAt: transactions.createdAt,
  updatedAt: transactions.updatedAt,
  // Account columns
  accountName: accounts.name,
  accountColor: accounts.color,
  accountIcon: accounts.icon,
  accountCurrency: accounts.currency,
  // ToAccount columns
  toAccountName: toAccounts.name,
  toAccountColor: toAccounts.color,
  toAccountIcon: toAccounts.icon,
  toAccountCurrency: toAccounts.currency,
  // Category columns
  categoryName: categories.name,
  categoryColor: categories.color,
  categoryIcon: categories.icon,
};

type EnrichedRow = Record<keyof typeof enrichedSelect, string | number | boolean | null>;

function mapRowToTransaction(row: EnrichedRow): TransactionWithDetails {
  return {
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
    recurringPaymentId: row.recurringPaymentId as string | null,
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
  };
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters) {
  const db = useDatabase();
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async (): Promise<TransactionWithDetails[]> => {
      const conditions = [];

      if (filters.year && filters.month) {
        const { start, end } = monthBounds(filters.year, filters.month);
        conditions.push(gte(transactions.date, start));
        conditions.push(lte(transactions.date, end));
      }
      if (filters.accountId) {
        conditions.push(
          sql`(${transactions.accountId} = ${filters.accountId} OR ${transactions.toAccountId} = ${filters.accountId})`,
        );
      }
      if (filters.categoryId) {
        conditions.push(eq(transactions.categoryId, filters.categoryId));
      }
      if (filters.type) {
        conditions.push(eq(transactions.type, filters.type));
      }
      if (filters.isRecurring !== undefined) {
        conditions.push(eq(transactions.isRecurring, filters.isRecurring));
      }
      if (filters.startsOnOrAfter) {
        conditions.push(gte(transactions.date, filters.startsOnOrAfter));
      }

      let query = db
        .select(enrichedSelect)
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(toAccounts, eq(transactions.toAccountId, toAccounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(
          filters.sort === "asc" ? asc(transactions.date) : desc(transactions.date),
          desc(transactions.createdAt),
        );

      if (filters.limit) {
        query = query.limit(filters.limit) as typeof query;
      }

      const rows = await query.all();
      return (rows as unknown as EnrichedRow[]).map(mapRowToTransaction);
    },
  });
}

export function useTransaction(id: string | undefined) {
  const db = useDatabase();
  return useQuery({
    queryKey: transactionKeys.detail(id ?? ""),
    queryFn: async (): Promise<TransactionWithDetails | undefined> => {
      const row = await db
        .select(enrichedSelect)
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(toAccounts, eq(transactions.toAccountId, toAccounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.id, id!))
        .get();

      if (!row) return undefined;
      return mapRowToTransaction(row as unknown as EnrichedRow);
    },
    enabled: !!id,
  });
}

// ── Transaction date range ────────────────────────────────────────────────────

export function useTransactionDateRange() {
  const db = useDatabase();
  return useQuery({
    queryKey: ["transaction-date-range"],
    queryFn: async () => {
      const result = (await db
        .select({
          minDate: sql<string>`MIN(${transactions.date})`,
          maxDate: sql<string>`MAX(${transactions.date})`,
        })
        .from(transactions)
        .get()) as { minDate: string | null; maxDate: string | null } | undefined;
      return result ?? { minDate: null, maxDate: null };
    },
  });
}

// ── Month summary ─────────────────────────────────────────────────────────────

export function useMonthSummary(
  year: number,
  month: number,
  accountId?: string | null,
  enabled = true,
) {
  const db = useDatabase();
  return useQuery({
    queryKey: ["month-summary", year, month, accountId],
    enabled,
    queryFn: async () => {
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
      for (const t of rows) {
        if (t.type === "income") totalIncome += t.amount;
        else if (t.type === "expense") totalExpense += t.amount;
      }

      return { totalIncome, totalExpense, netAmount: totalIncome - totalExpense };
    },
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt" | "isRecurring"> & {
  isRecurring?: boolean;
};

export function useCreateTransaction() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewTransaction) => {
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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
      qc.invalidateQueries({ queryKey: ["account-balances"] });
      qc.invalidateQueries({ queryKey: ["month-summary"] });
    },
  });
}

export function useUpdateTransaction() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Transaction, "id" | "createdAt" | "date"> & { date?: Date | string }>;
    }) => {
      await db
        .update(transactions)
        .set({
          ...data,
          date: isDate(data?.date) ? toDateString(data.date as unknown as Date) : data?.date,
          updatedAt: nowIso(),
        })
        .where(eq(transactions.id, id));
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
      qc.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["account-balances"] });
      qc.invalidateQueries({ queryKey: ["month-summary"] });
    },
  });
}

export function useDeleteTransaction() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(transactions).where(eq(transactions.id, id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transactionKeys.all });
      qc.invalidateQueries({ queryKey: ["account-balances"] });
      qc.invalidateQueries({ queryKey: ["month-summary"] });
    },
  });
}
