import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useLocalAccountDataSource } from "@/modules/ledger-data-source/local";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { toDateString } from "@/utils/date";
import type { Account } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  const source = useLocalAccountDataSource();
  const query = useQuery({
    queryKey: [...accountKeys.all, source.cacheKey],
    queryFn: source.reads.accounts.accounts,
  });
  return { ...query, source: source.source, offlineState: source.offlineState };
}

export function useAccount(id: string) {
  const source = useLocalAccountDataSource();
  const query = useQuery({
    queryKey: [...accountKeys.detail(id), source.cacheKey],
    queryFn: () => source.reads.accounts.account(id),
  });
  return { ...query, source: source.source };
}

export function useAccountsWithBalances() {
  return useAccountBalances(false);
}

export function useAllAccountsWithBalances() {
  return useAccountBalances(true);
}

function useAccountBalances(includeArchived: boolean) {
  const source = useLocalAccountDataSource();
  const query = useQuery({
    queryKey: [
      ...(includeArchived ? accountKeys.managementBalances : accountKeys.balances),
      source.cacheKey,
    ],
    queryFn: () => source.reads.accounts.accountBalances(includeArchived),
  });
  return { ...query, source: source.source };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateAccount() {
  const source = useLocalAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.accounts.createAccount,
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "account.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useUpdateAccount() {
  const source = useLocalAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Account, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">>;
    }) => source.mutations.accounts.updateAccount(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "account.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useAccountArchivalPreview(id: string) {
  const source = useLocalAccountDataSource();
  const localDate = toDateString(new Date());
  const query = useQuery({
    queryKey: accountKeys.archivalPreview(id, localDate),
    queryFn: () => source.reads.accounts.archivalPreview(id, localDate),
  });
  return { ...query, source: source.source };
}

export function useAccountDeletionPreview(id: string) {
  const source = useLocalAccountDataSource();
  const query = useQuery({
    queryKey: accountKeys.deletionPreview(id),
    queryFn: () => source.reads.accounts.deletionPreview(id),
  });
  return { ...query, source: source.source };
}

export function useArchiveAccount() {
  const source = useLocalAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.accounts.archiveAccount,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.archived", id }),
  });
  return { ...mutation, source: source.source };
}

export function useRestoreAccount() {
  const source = useLocalAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.accounts.restoreAccount,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.restored", id }),
  });
  return { ...mutation, source: source.source };
}

export function useDeleteAccount() {
  const source = useLocalAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.accounts.deleteAccount,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.deleted", id }),
  });
  return { ...mutation, source: source.source };
}
