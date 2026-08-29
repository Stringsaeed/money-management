import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccountDataSource } from "@/modules/ledger-data-source/coordinator";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { toDateString } from "@/utils/date";
import type { Account } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  const source = useAccountDataSource();
  const query = useQuery({
    queryKey: [...accountKeys.all, source.cacheKey],
    queryFn: source.accounts.list,
  });
  return { ...query, source: source.source, offlineState: source.offlineState };
}

export function useAccount(id: string) {
  const source = useAccountDataSource();
  const query = useQuery({
    queryKey: [...accountKeys.detail(id), source.cacheKey],
    queryFn: () => source.accounts.get(id),
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
  const source = useAccountDataSource();
  const query = useQuery({
    queryKey: [
      ...(includeArchived ? accountKeys.managementBalances : accountKeys.balances),
      source.cacheKey,
    ],
    queryFn: () => source.accounts.listWithBalances(includeArchived),
  });
  return { ...query, source: source.source };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateAccount() {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.accounts.create,
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "account.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useUpdateAccount() {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Account, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">>;
    }) => source.accounts.update(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "account.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useAccountArchivalPreview(id: string) {
  const source = useAccountDataSource();
  const localDate = toDateString(new Date());
  const query = useQuery({
    queryKey: accountKeys.archivalPreview(id, localDate),
    queryFn: () => {
      if (source.accountLifecycle.kind !== "local") {
        throw new Error("Account archival preview is not available for the synced ledger yet.");
      }
      return source.accountLifecycle.archivalPreview(id, localDate);
    },
  });
  return { ...query, source: source.source };
}

export function useAccountDeletionPreview(id: string) {
  const source = useAccountDataSource();
  const query = useQuery({
    queryKey: accountKeys.deletionPreview(id),
    queryFn: () => {
      if (source.accountLifecycle.kind !== "local") {
        throw new Error("Account deletion preview is not available for the synced ledger yet.");
      }
      return source.accountLifecycle.deletionPreview(id);
    },
  });
  return { ...query, source: source.source };
}

export function useArchiveAccount() {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.accounts.archive,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.archived", id }),
  });
  return { ...mutation, source: source.source };
}

export function useRestoreAccount() {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => {
      if (source.accountLifecycle.kind !== "local") {
        throw new Error("Account restore is not available for the synced ledger yet.");
      }
      return source.accountLifecycle.restore(id);
    },
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.restored", id }),
  });
  return { ...mutation, source: source.source };
}

export function useDeleteAccount() {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => {
      if (source.accountLifecycle.kind !== "local") {
        throw new Error("Account deletion is not available for the synced ledger yet.");
      }
      return source.accountLifecycle.delete(id);
    },
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.deleted", id }),
  });
  return { ...mutation, source: source.source };
}
