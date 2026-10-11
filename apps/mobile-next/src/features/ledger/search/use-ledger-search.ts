import { useState } from "react";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import {
  useTransactionPagesQuery,
  useTransactionSummaryQuery,
} from "@/data/transaction-list-queries";

import { primaryTotals } from "../list/ledger-totals";
import { EMPTY_SEARCH, isSearching, searchFilters, type LedgerSearchState } from "./search-model";
import { useDebouncedValue } from "./use-debounced-value";

/** A pause this long after the last keystroke sends the search. */
const TYPING_PAUSE_MS = 250;

export type SearchSheet = "date" | "account" | "category" | null;

/** Search text, chip filters, the matching pages and their totals, and the open picker. */
export function useLedgerSearch() {
  const [state, setState] = useState<LedgerSearchState>(EMPTY_SEARCH);
  const [sheet, setSheet] = useState<SearchSheet>(null);
  const query = useDebouncedValue(state.query.trim(), TYPING_PAUSE_MS);
  const applied = { ...state, query };
  const active = isSearching(applied);
  const today = new Date();
  const filters = searchFilters(applied, today);
  const pages = useTransactionPagesQuery(filters, { enabled: active });
  const summary = useTransactionSummaryQuery(filters, { enabled: active });
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  // Changes whenever an Account or Category a row might display is added, edited, or removed.
  const lookupVersion = [...accounts.data, ...categories.data]
    .map((item) => `${item.id}:${item.version}`)
    .join("|");

  return {
    state,
    /** The query the results belong to, for marking matches. */
    query,
    active,
    today,
    pages,
    summary,
    totals: primaryTotals(summary.data),
    accounts: accounts.data.filter((account) => !account.archived),
    categories: categories.data.filter((category) => !category.archived),
    accountById: new Map<string, V2Account>(accounts.data.map((item) => [item.id, item])),
    categoryById: new Map<string, V2Category>(categories.data.map((item) => [item.id, item])),
    lookupVersion,
    sheet,
    openSheet: setSheet,
    closeSheet: () => setSheet(null),
    update: (change: Partial<LedgerSearchState>) =>
      setState((current) => ({ ...current, ...change })),
    refresh: async () => {
      await Promise.all([pages.refresh(), summary.refresh()]);
    },
  };
}

export type LedgerSearchModel = ReturnType<typeof useLedgerSearch>;
