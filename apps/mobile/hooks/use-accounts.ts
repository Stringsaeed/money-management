import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";
import { useSQLiteContext } from "expo-sqlite";

import { useDatabase } from "@/db/client";
import { accounts, transactions } from "@/db/schema";
import { updateAccountWithRecurringRules } from "@/modules/account-recurring-coordinator";
import {
  archiveAccount,
  deleteAccount,
  previewAccountArchival,
  previewAccountDeletion,
  restoreAccount,
} from "@/modules/accounts/account-lifecycle";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { nowIso, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { Account, AccountWithBalance } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  const db = useDatabase();
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: async () =>
      (await db
        .select()
        .from(accounts)
        .where(eq(accounts.lifecycle, "active"))
        .orderBy(accounts.sortOrder, accounts.createdAt)
        .all()) as Account[],
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
  return useAccountBalances(false);
}

export function useAllAccountsWithBalances() {
  return useAccountBalances(true);
}

function useAccountBalances(includeArchived: boolean) {
  const db = useDatabase();
  return useQuery({
    queryKey: includeArchived ? accountKeys.managementBalances : accountKeys.balances,
    queryFn: async (): Promise<AccountWithBalance[]> => {
      // Fetch all accounts
      const baseQuery = db.select().from(accounts);
      const allAccounts = (await (includeArchived
        ? baseQuery.orderBy(accounts.sortOrder, accounts.createdAt).all()
        : baseQuery
            .where(eq(accounts.lifecycle, "active"))
            .orderBy(accounts.sortOrder, accounts.createdAt)
            .all())) as Account[];

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
    mutationFn: async (
      data: Omit<Account, "id" | "createdAt" | "updatedAt" | "lifecycle" | "lifecycleChangedAt">,
    ) => {
      const now = nowIso();
      const id = generateId();
      await db.insert(accounts).values({
        ...data,
        id,
        lifecycle: "active",
        lifecycleChangedAt: null,
        createdAt: now,
        updatedAt: now,
      });
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
      data: Partial<Omit<Account, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">>;
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

export function useAccountArchivalPreview(id: string) {
  const database = useSQLiteContext();
  return useQuery({
    queryKey: [...accountKeys.detail(id), "archival-preview"],
    queryFn: () => previewAccountArchival(database, id),
  });
}

export function useAccountDeletionPreview(id: string) {
  const database = useSQLiteContext();
  return useQuery({
    queryKey: [...accountKeys.detail(id), "deletion-preview"],
    queryFn: () => previewAccountDeletion(database, id),
  });
}

export function useArchiveAccount() {
  const database = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const archivedAt = new Date(nowIso());
      return archiveAccount(database, {
        accountId: id,
        localDate: toDateString(archivedAt),
        now: archivedAt.toISOString(),
      });
    },
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "account.archived", id }),
  });
}

export function useRestoreAccount() {
  const database = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAccount(database, { accountId: id, now: nowIso() }),
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "account.restored", id }),
  });
}

export function useDeleteAccount() {
  const database = useSQLiteContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(database, id),
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "account.deleted", id }),
  });
}
