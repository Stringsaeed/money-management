import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";
import { useSQLiteContext } from "expo-sqlite";

import { useDatabase } from "@/db/client";
import { accounts, transactions } from "@/db/schema";
import {
  deleteAccountWithRecurringRules,
  previewAccountDeletion,
  updateAccountWithRecurringRules,
} from "@/modules/account-recurring-coordinator";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { Account, AccountWithBalance } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  const db = useDatabase();
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () =>
      db.select().from(accounts).orderBy(accounts.sortOrder, accounts.createdAt).all() as Account[],
  });
}

export function useAccount(id: string) {
  const db = useDatabase();
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () =>
      db.select().from(accounts).where(eq(accounts.id, id)).get() as Account | undefined,
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
    onSuccess: (id) => cohereLedgerCache(qc, { kind: "account.created", id }),
  });
}

export function useUpdateAccount() {
  const database = useSQLiteContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Account, "id" | "createdAt">>;
    }) => {
      return updateAccountWithRecurringRules(database, {
        accountId: id,
        changes: data,
        now: nowIso(),
      });
    },
    onSuccess: (_, { id }) => cohereLedgerCache(qc, { kind: "account.updated", id }),
  });
}

export function usePreviewAccountDeletion() {
  const database = useSQLiteContext();
  return useMutation({
    mutationFn: (id: string) => previewAccountDeletion(database, id),
  });
}

export function useDeleteAccount() {
  const database = useSQLiteContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteAccountWithRecurringRules(database, { accountId: id, now: nowIso() }),
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "account.deleted", id }),
  });
}
