import { useState } from "react";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import {
  useTransactionPagesQuery,
  useTransactionSummaryQuery,
} from "@/data/transaction-list-queries";

import {
  activeFilters,
  EMPTY_LEDGER_FILTERS,
  pruneFilters,
  removeFilter,
  toListFilters,
  type ActiveFilter,
  type LedgerFilterState,
} from "./ledger-filters";

/** Filter state, the server-paged list, and lookups shared by every Ledger layout. */
export function useLedgerList() {
  const [rawFilters, setFilters] = useState<LedgerFilterState>(EMPTY_LEDGER_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const filters = pruneFilters(rawFilters, accounts.data, categories.data);
  const listFilters = toListFilters(filters);
  const pages = useTransactionPagesQuery(listFilters);
  const summary = useTransactionSummaryQuery(listFilters);
  const activeAccounts = accounts.data.filter((account) => !account.archived);
  const activeCategories = categories.data.filter((category) => !category.archived);
  const chips = activeFilters(filters, accounts.data, categories.data);
  // Changes whenever an Account or Category a row might display is added, edited, or removed.
  const lookupVersion = [...accounts.data, ...categories.data]
    .map((item) => `${item.id}:${item.version}`)
    .join("|");

  return {
    filters,
    chips,
    pages,
    summary,
    accounts: activeAccounts,
    categories: activeCategories,
    accountById: new Map<string, V2Account>(accounts.data.map((item) => [item.id, item])),
    lookupVersion,
    categoryById: new Map<string, V2Category>(categories.data.map((item) => [item.id, item])),
    filtersOpen,
    openFilters: () => setFiltersOpen(true),
    closeFilters: () => setFiltersOpen(false),
    update: (change: (current: LedgerFilterState) => LedgerFilterState) =>
      setFilters((current) => change(pruneFilters(current, accounts.data, categories.data))),
    remove: (chip: ActiveFilter) => setFilters((current) => removeFilter(current, chip)),
    clear: () => setFilters(EMPTY_LEDGER_FILTERS),
  };
}

export type LedgerListModel = ReturnType<typeof useLedgerList>;
