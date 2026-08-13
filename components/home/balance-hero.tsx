import { useMemo } from "react";
import { View } from "react-native";

import { NumberFlow } from "@/components/ui/number-flow";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useLoadAfterTimeout } from "@/hooks/use-load-after-timeout";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { groupByDay } from "@/utils/transaction";

export function BalanceHero() {
  const { selectedYear, selectedMonth, activeAccountId, selectedCategoryId } = useUIStore();
  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: transactions = [] } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
    categoryId: selectedCategoryId,
  });

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const currency =
    activeAccount?.currency ?? transactions[0]?.currency ?? accounts[0]?.currency ?? "USD";

  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;

  const groups = groupByDay(transactions);

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
  const balance = useLoadAfterTimeout(filteredBalance, 0, 500);

  return (
    <View className="px-5 pb-2 bg-background min-h-[55px]">
      <NumberFlow
        className="font-heading-medium text-5xl tabular-nums text-ink"
        value={balance / 100}
        format={{
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
      />
    </View>
  );
}
