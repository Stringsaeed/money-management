import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useTransactionPage } from "@/hooks/use-transactions";
import { useLedgerLifecycle } from "@/modules/ledger-data-source/coordinator";
import { cohereLedgerEffects } from "@/modules/ledger-cache";
import type { Account, Category, TransactionWithDetails } from "@/types";

export type LedgerAccount = Account;
export type LedgerCategory = Category;
export interface TransactionPage {
  readonly transactions: readonly TransactionWithDetails[];
  readonly hasMore: boolean;
}

/**
 * Provider-selected ledger reads. Anonymous surfaces use the local adapter;
 * explicitly synced surfaces use the server adapter without fallback. React
 * Query and the ledger-cache owner keep the public result shape coherent.
 */

export function useLedgerAccounts(_householdId: string | null) {
  return useAccounts();
}

export function useLedgerCategories(_householdId: string | null) {
  return useCategories();
}

export function useLedgerTransactions(
  _householdId: string | null,
  options: { limit?: number; beforeDate?: string } = {},
) {
  return useTransactionPage(options);
}

/**
 * Aggregated ledger view for one household. Pass `effects` from
 * `useSyncDeltas` — when a polled delta touches a covered tag, the matching
 * lists refetch. Tag-driven refetches are deduped by react-query.
 */
export function useLedger(householdId: string | null, effects: readonly string[] = []) {
  const queryClient = useQueryClient();
  const lifecycle = useLedgerLifecycle();
  const accounts = useLedgerAccounts(householdId);
  const categories = useLedgerCategories(householdId);
  const transactions = useLedgerTransactions(householdId);

  useEffect(() => {
    if (effects.length === 0) {
      return;
    }
    void cohereLedgerEffects(queryClient, effects);
  }, [effects, queryClient]);

  const error = accounts.error ?? categories.error ?? transactions.error;
  return {
    source: lifecycle.kind,
    lifecycle,
    offlineState: lifecycle.offlineState,
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    transactions: transactions.data?.transactions ?? [],
    hasMoreTransactions: transactions.data?.hasMore ?? false,
    isPending: accounts.isPending || categories.isPending || transactions.isPending,
    isError: accounts.isError || categories.isError || transactions.isError,
    error: error instanceof Error ? error : null,
    refetch: () =>
      Promise.all([accounts.refetch(), categories.refetch(), transactions.refetch()]).then(
        () => undefined,
      ),
  };
}
