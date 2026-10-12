import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { useTransactionPagesQuery } from "@/data/transaction-list-queries";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { hasCardSpending, largestTransactions } from "./envelope-model";

/** This period's expenses in the envelope's Categories, and the lookups its rows read. */
export function useEnvelopeSpending(view: ActiveBudgetView, line: EnvelopeLine) {
  const categories = useCategoriesQuery();
  const accounts = useAccountsQuery();
  const { categoryIds } = line.envelope;
  const hasCategories = categoryIds.length > 0;
  const list = useTransactionPagesQuery(
    {
      categoryIds,
      kinds: ["expense"],
      from: view.current.period.start,
      to: view.current.period.end,
    },
    // An empty category filter would list every transaction.
    { enabled: hasCategories },
  );
  return {
    list,
    hasCategories,
    categoriesById: new Map(categories.data.map((category) => [category.id, category])),
    accountsById: new Map(accounts.data.map((account) => [account.id, account])),
    onCard: hasCardSpending(list.data, accounts.data),
    largest: largestTransactions(list.data),
    /** Re-render rows when Category or Account names arrive. */
    lookupVersion: `${categories.data.length}:${accounts.data.length}`,
  };
}

export type EnvelopeSpending = ReturnType<typeof useEnvelopeSpending>;
