import { useQuery } from "@tanstack/react-query";

import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

import { ledgerClient } from "@/data/ledger-client";
import { budgetKey, useLedgerData } from "@/data/ledger-queries";

const ACTIVITY_LIMIT = 5;

export interface UseBudgetActivity {
  readonly items: readonly V2BudgetActivityItem[];
  readonly isLoading: boolean;
}

/**
 * Recent money moves in a household budget. Lives under the Budget key, so every plan, cover, and
 * move refreshes it with the rest of the Budget. Idle in Personal, which has one person.
 */
export function useBudgetActivity(): UseBudgetActivity {
  const { identityKey, scope } = useLedgerData();
  const query = useQuery({
    queryKey: [...budgetKey(identityKey, scope), "activity", ACTIVITY_LIMIT],
    queryFn: () => ledgerClient.budget.activity(scope, ACTIVITY_LIMIT),
    enabled: scope.kind === "household",
    staleTime: 15_000,
    retry: 1,
  });
  return { items: query.data?.items ?? [], isLoading: query.isLoading };
}
