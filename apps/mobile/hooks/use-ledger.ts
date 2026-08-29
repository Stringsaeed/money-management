import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommandEnvelope } from "@trove/protocol";

import {
  createSyncedLedgerDataSource,
  type SyncedAccount as LedgerAccount,
  type SyncedCategory as LedgerCategory,
  type SyncedTransactionPage as TransactionPage,
} from "@/modules/ledger-data-source/synced";

export type { LedgerAccount, LedgerCategory, TransactionPage };

/**
 * Server-authoritative ledger reads (#86). Each list is a react-query entry;
 * committed commands announce their blast radius as effect tags on the sync
 * feed (`useSyncDeltas`), and those tags invalidate the matching entries here.
 * Screens read through these hooks and write through `commands.apply` until
 * #85's outbox worker takes over optimistic queueing.
 */

/** Maps sync effect tags onto the ledger query segments they invalidate. */
export function ledgerQueriesForEffects(effects: readonly string[]): readonly string[] {
  const queries = new Set<string>();
  if (effects.some((e) => e === "ledger" || e === "balances")) {
    queries.add("accounts");
    queries.add("transactions");
  }
  if (effects.includes("summaries")) {
    queries.add("categories");
  }
  return [...queries];
}

export function useLedgerAccounts(householdId: string | null) {
  const source = householdId ? createSyncedLedgerDataSource({ householdId }) : null;
  return useQuery({
    queryKey: ["ledger", "accounts", householdId],
    queryFn: () => source!.reads.accounts.list(),
    enabled: Boolean(householdId),
  });
}

export function useLedgerCategories(householdId: string | null) {
  const source = householdId ? createSyncedLedgerDataSource({ householdId }) : null;
  return useQuery({
    queryKey: ["ledger", "categories", householdId],
    queryFn: () => source!.reads.categories.list(),
    enabled: Boolean(householdId),
  });
}

export function useLedgerTransactions(
  householdId: string | null,
  options: { limit?: number; beforeDate?: string } = {},
) {
  const { limit, beforeDate } = options;
  const source = householdId ? createSyncedLedgerDataSource({ householdId }) : null;
  return useQuery({
    queryKey: ["ledger", "transactions", householdId, limit ?? null, beforeDate ?? null],
    queryFn: () => source!.reads.transactions.list({ limit, beforeDate }),
    enabled: Boolean(householdId),
  });
}

/**
 * Aggregated ledger view for one household. Pass `effects` from
 * `useSyncDeltas` — when a polled delta touches a covered tag, the matching
 * lists refetch. Tag-driven refetches are deduped by react-query.
 */
export function useLedger(householdId: string | null, effects: readonly string[] = []) {
  const queryClient = useQueryClient();
  const source = householdId ? createSyncedLedgerDataSource({ householdId }) : null;
  const accounts = useLedgerAccounts(householdId);
  const categories = useLedgerCategories(householdId);
  const transactions = useLedgerTransactions(householdId);

  useEffect(() => {
    if (!householdId) {
      return;
    }
    for (const segment of ledgerQueriesForEffects(effects)) {
      void queryClient.invalidateQueries({
        queryKey: ["ledger", segment, householdId],
      });
    }
  }, [effects, householdId, queryClient]);

  const error = accounts.error ?? categories.error ?? transactions.error;
  return {
    source: "synced" as const,
    offlineState: source?.offlineState ?? null,
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    /** Newest-first page plus its keyset cursor. */
    transactions: transactions.data?.transactions ?? [],
    hasMoreTransactions: transactions.data?.hasMore ?? false,
    isPending: accounts.isPending || categories.isPending || transactions.isPending,
    isError: accounts.isError || categories.isError || transactions.isError,
    error: error instanceof Error ? error : null,
    refetch: () =>
      Promise.all([accounts.refetch(), categories.refetch(), transactions.refetch()]).then(
        () => undefined,
      ),
    hydrate: (input: { since: number }) => {
      if (!source) {
        return Promise.reject(new Error("A household is required to hydrate the synced ledger."));
      }
      return source.hydration.pull(input);
    },
    writeback: (command: CommandEnvelope) => {
      if (!source) {
        return Promise.reject(
          new Error("A household is required to write back to the synced ledger."),
        );
      }
      return source.writeback.submit(command);
    },
  };
}
