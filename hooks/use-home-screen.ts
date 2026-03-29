import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useRecurringProcessor } from "@/hooks/use-recurring-processor";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { groupByDay } from "@/utils/transaction";

interface UseHomeScreenOptions {
  limit?: number;
}

export function useHomeScreen({ limit }: UseHomeScreenOptions = {}) {
  useRecurringProcessor();

  const { selectedYear, selectedMonth, activeAccountId, selectedCategoryId, resetFilters } =
    useUIStore();

  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsWithBalances();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
    categoryId: selectedCategoryId,
    limit,
  });

  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;

  const groups = groupByDay(transactions);
  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const currency =
    activeAccount?.currency ?? transactions[0]?.currency ?? accounts[0]?.currency ?? "USD";

  return {
    accounts,
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccountId,
    resetFilters,
  };
}
