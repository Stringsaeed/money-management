import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccountDataSource } from "@/modules/ledger-data-source/coordinator";
import {
  unsupportedSyncedOperation,
  type AccountUpdate,
} from "@/modules/ledger-data-source/contract";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { toDateString } from "@/utils/date";

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
    mutationFn: async ({ id, data }: { id: string; data: AccountUpdate }) =>
      source.accounts.update(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "account.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useAccountArchivalPreview(id: string) {
  const source = useAccountDataSource();
  const localDate = toDateString(new Date());
  const query = useQuery({
    queryKey: [...accountKeys.archivalPreview(id, localDate), source.cacheKey],
    enabled: source.accountLifecycle.kind === "local",
    queryFn: () => {
      if (source.accountLifecycle.kind !== "local") {
        throw unsupportedSyncedOperation(
          "Account archival preview",
          "No Account was changed.",
          "Archive only from a flow that does not require the local dependency preview.",
        );
      }
      return source.accountLifecycle.archivalPreview(id, localDate);
    },
  });
  return { ...query, source: source.source };
}

export function useAccountDeletionPreview(id: string) {
  const source = useAccountDataSource();
  const query = useQuery({
    queryKey: [...accountKeys.deletionPreview(id), source.cacheKey],
    enabled: source.accountLifecycle.kind === "local",
    queryFn: () => {
      if (source.accountLifecycle.kind !== "local") {
        throw unsupportedSyncedOperation(
          "Account deletion preview",
          "No Account was changed.",
          "Archive the Account instead of deleting it.",
        );
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
        throw unsupportedSyncedOperation(
          "Account restore",
          "The Account remains archived.",
          "Leave it archived until synced restore is supported.",
        );
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
        throw unsupportedSyncedOperation(
          "Account deletion",
          "The Account remains unchanged.",
          "Archive the Account instead.",
        );
      }
      return source.accountLifecycle.delete(id);
    },
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "account.deleted", id }),
  });
  return { ...mutation, source: source.source };
}
