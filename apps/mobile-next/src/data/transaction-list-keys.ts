import type { LedgerScope, TransactionListFilters } from "./ledger-client";
import { scopeKey } from "./ledger-collections";

/** Root key for every server-paged Transaction query in one identity + ledger scope. */
export const transactionListKey = (identityKey: string, scope: LedgerScope) =>
  ["v2", "transaction-list", scopeKey(identityKey, scope)] as const;

/**
 * Canonical filter shape for query keys: sorted ids, no empty fields, so the same selection
 * made in a different order shares one cache entry.
 */
export function normalizeTransactionFilters(
  filters: TransactionListFilters,
): TransactionListFilters {
  const sorted = <T extends string>(values: readonly T[] | undefined) =>
    values?.length ? [...new Set(values)].sort() : undefined;
  return {
    accountIds: sorted(filters.accountIds),
    categoryIds: sorted(filters.categoryIds),
    kinds: sorted(filters.kinds),
    from: filters.from || undefined,
    to: filters.to || undefined,
    search: filters.search?.trim() || undefined,
  };
}
