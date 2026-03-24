import { useMemo } from "react";

import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useMonthSummary, useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { groupByDay } from "@/utils/transaction";

export function useHomeScreen() {
  useRecurringProcessor();

  const {
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    activeAccountId,
    setActiveAccountId,
    selectedCategoryId,
    setSelectedCategoryId,
    resetFilters,
  } = useUIStore();

  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();
  const { data: allCategories = [] } = useCategories();
  const { data: allTransactions = [], isLoading: loadingTx } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
  });
  const { data: summary } = useMonthSummary(
    selectedYear ?? 0,
    selectedMonth ?? 0,
    activeAccountId,
    !!(selectedYear && selectedMonth),
  );

  // Client-side category filter
  const transactions = useMemo(() => {
    if (!selectedCategoryId) return allTransactions;
    return allTransactions.filter((t) => t.category?.id === selectedCategoryId);
  }, [allTransactions, selectedCategoryId]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const activeCategory = allCategories.find((c) => c.id === selectedCategoryId);
  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;

  const groups = groupByDay(transactions);
  const currency =
    activeAccount?.currency ?? transactions[0]?.currency ?? accounts[0]?.currency ?? "USD";

  return {
    accounts,
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccount,
    activeCategory,
    summary: selectedMonth ? summary : undefined,
    selectedYear,
    selectedMonth,
    selectedCategoryId,
    activeAccountId,
    setSelectedMonth,
    setActiveAccountId,
    setSelectedCategoryId,
    resetFilters,
  };
}
