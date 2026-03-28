import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useTransactionDateRange, useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { groupByDay } from "@/utils/transaction";

interface UseHomeScreenOptions {
  limit?: number;
}

export function useHomeScreen({ limit }: UseHomeScreenOptions = {}) {
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
  const { data: transactions = [], isLoading: loadingTx } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
    categoryId: selectedCategoryId,
    limit,
  });
  const { data: dateRange } = useTransactionDateRange();

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
    allCategories,
    dateRange,
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccount,
    activeCategory,
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
