import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useSQLiteContext } from "expo-sqlite";

import { useDatabase } from "@/db/client";
import { accounts } from "@/db/schema";
import { updateAccountWithRecurringRules } from "@/modules/account-recurring-coordinator";
import {
  archiveAccount,
  deleteAccount,
  previewAccountArchival,
  previewAccountDeletion,
  restoreAccount,
} from "@/modules/accounts/account-lifecycle";
import { loadAccountBalances } from "@/modules/accounts/account-balance";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { nowIso, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { Account } from "@/types";

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
  const database = useSQLiteContext();
  return useQuery({
    queryKey: includeArchived ? accountKeys.managementBalances : accountKeys.balances,
    queryFn: () => loadAccountBalances(database, includeArchived),
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
  const localDate = toDateString(new Date());
  return useQuery({
    queryKey: [...accountKeys.detail(id), "archival-preview", localDate],
    queryFn: () => previewAccountArchival(database, id, localDate),
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
