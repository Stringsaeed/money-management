import { useMemo } from "react";

import { useCategorySpending, useMonthlyTrend } from "@/hooks/use-chart-data";
import type { AccountWithBalance, DayGroup } from "@/types";

interface UseHomeInsightsArgs {
  accounts: AccountWithBalance[];
  groups: DayGroup[];
  activeFilterCount: number;
}

export function useHomeInsights({ accounts, groups, activeFilterCount }: UseHomeInsightsArgs) {
  const flatTransactions = useMemo(() => groups.flatMap((group) => group.transactions), [groups]);

  const filteredBalance = useMemo(() => {
    if (activeFilterCount === 0) {
      return accounts.reduce((sum, account) => sum + account.balance, 0);
    }

    let net = 0;
    for (const group of groups) {
      for (const transaction of group.transactions) {
        if (transaction.type === "income") {
          net += transaction.amount;
        } else if (transaction.type === "expense") {
          net -= transaction.amount;
        }
      }
    }

    return net;
  }, [activeFilterCount, accounts, groups]);

  const categorySpending = useCategorySpending(flatTransactions);
  const monthlyTrend = useMonthlyTrend(flatTransactions);

  return {
    flatTransactions,
    filteredBalance,
    categorySpending,
    monthlyTrend,
  };
}
