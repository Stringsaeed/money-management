import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { useDatabase } from "@/db/client";
import { accounts, categories, transactions } from "@/db/schema";
import { generateId } from "@/utils/id";
import { nowIso, monthBounds } from "@/utils/date";
import type { Transaction, TransactionWithDetails } from "@/types";
import { formatISO, isDate } from "date-fns";

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
  type?: Transaction["type"];
}

// ── Helper: enrich transactions with account/category names ───────────────────

async function enrichTransactions(
  db: ReturnType<typeof import("@/db/client").useDatabase>,
  rows: Transaction[],
): Promise<TransactionWithDetails[]> {
  if (rows.length === 0) return [];

  // Fetch all accounts and categories in two queries (faster than per-row joins)
  const allAccounts = await db.select().from(accounts).all();
  const allCategories = await db.select().from(categories).all();

  const accountMap = new Map(allAccounts.map((a) => [a.id, a]));
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  return rows.map((t) => {
    const acc = accountMap.get(t.accountId);
    const toAcc = t.toAccountId ? accountMap.get(t.toAccountId) : undefined;
    const cat = t.categoryId ? categoryMap.get(t.categoryId) : undefined;

    return {
      ...t,
      account: acc
        ? { id: acc.id, name: acc.name, color: acc.color, icon: acc.icon, currency: acc.currency }
        : {
            id: t.accountId,
            name: "Unknown",
            color: "#ccc",
            icon: "banknote.fill",
            currency: "USD",
          },
      toAccount: toAcc
        ? {
            id: toAcc.id,
            name: toAcc.name,
            color: toAcc.color,
            icon: toAcc.icon,
            currency: toAcc.currency,
          }
        : null,
      category: cat ? { id: cat.id, name: cat.name, color: cat.color, icon: cat.icon } : null,
    };
  });
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
      if (filters.type) {
        conditions.push(eq(transactions.type, filters.type));
      }

      const rows = (await db
        .select()
        .from(transactions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .all()) as Transaction[];

      return enrichTransactions(db, rows);
    },
  });
}

export function useTransaction(id: string) {
  const db = useDatabase();
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async (): Promise<TransactionWithDetails | undefined> => {
      const row = (await db.select().from(transactions).where(eq(transactions.id, id)).get()) as
        | Transaction
        | undefined;

      if (!row) return undefined;
      const enriched = await enrichTransactions(db, [row]);
      return enriched[0];
    },
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

type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

export function useCreateTransaction() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewTransaction) => {
      const now = nowIso();
      const id = generateId();
      await db.insert(transactions).values({ ...data, id, createdAt: now, updatedAt: now });
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
          date: isDate(data?.date) ? formatISO(data.date) : data?.date,
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
