import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";

import { useDatabase } from "@/db/client";
import { accounts, transactions } from "@/db/schema";
import { generateId } from "@/utils/id";
import { nowIso } from "@/utils/date";
import type { Account, AccountWithBalance } from "@/types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const accountKeys = {
  all: ["accounts"] as const,
  balances: ["account-balances"] as const,
  detail: (id: string) => ["accounts", id] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  const db = useDatabase();
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () =>
      db.select().from(accounts).orderBy(accounts.sortOrder, accounts.createdAt).all() as Promise<
        Account[]
      >,
  });
}

export function useAccount(id: string) {
  const db = useDatabase();
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () =>
      db.select().from(accounts).where(eq(accounts.id, id)).get() as Promise<Account | undefined>,
  });
}

export function useAccountsWithBalances() {
  const db = useDatabase();
  return useQuery({
    queryKey: accountKeys.balances,
    queryFn: async (): Promise<AccountWithBalance[]> => {
      // Fetch all accounts
      const allAccounts = (await db
        .select()
        .from(accounts)
        .orderBy(accounts.sortOrder, accounts.createdAt)
        .all()) as Account[];

      // Compute balance for each account via SQL
      // balance = initialBalance + SUM(income) - SUM(expense) + SUM(transfer-in) - SUM(transfer-out)
      const balanceRows = await db
        .select({
          accountId: accounts.id,
          balance: sql<number>`
            ${accounts.initialBalance} + COALESCE(SUM(
              CASE
                WHEN ${transactions.type} = 'income' THEN ${transactions.amount}
                WHEN ${transactions.type} = 'expense' THEN -${transactions.amount}
                WHEN ${transactions.type} = 'transfer' AND ${transactions.toAccountId} = ${accounts.id} THEN ${transactions.amount}
                WHEN ${transactions.type} = 'transfer' AND ${transactions.accountId} = ${accounts.id} THEN -${transactions.amount}
                ELSE 0
              END
            ), 0)
          `.as("balance"),
        })
        .from(accounts)
        .leftJoin(
          transactions,
          sql`${transactions.accountId} = ${accounts.id} OR ${transactions.toAccountId} = ${accounts.id}`,
        )
        .groupBy(accounts.id)
        .all();

      const balanceMap = new Map(balanceRows.map((r) => [r.accountId, r.balance]));

      return allAccounts.map((acc) => ({
        ...acc,
        balance: balanceMap.get(acc.id) ?? acc.initialBalance,
      }));
    },
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateAccount() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Account, "id" | "createdAt" | "updatedAt">) => {
      const now = nowIso();
      const id = generateId();
      await db.insert(accounts).values({ ...data, id, createdAt: now, updatedAt: now });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balances });
    },
  });
}

export function useUpdateAccount() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Account, "id" | "createdAt">>;
    }) => {
      await db
        .update(accounts)
        .set({ ...data, updatedAt: nowIso() })
        .where(eq(accounts.id, id));
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balances });
      qc.invalidateQueries({ queryKey: accountKeys.detail(id) });
    },
  });
}

export function useDeleteAccount() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(accounts).where(eq(accounts.id, id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balances });
    },
  });
}
