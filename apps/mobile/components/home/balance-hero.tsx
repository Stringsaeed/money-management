import { useMemo } from "react";
import { View } from "react-native";

import { NumberFlow } from "@/components/ui/number-flow";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useLoadAfterTimeout } from "@/hooks/use-load-after-timeout";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { currencyAffixes } from "@/utils/currency";
import { groupByDay } from "@/utils/transaction";

import { styles } from "./styles";

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

  const { prefix, suffix } = useMemo(() => currencyAffixes(currency), [currency]);

  return (
    <View style={styles.balanceHeroWrap}>
      <NumberFlow
        value={balance / 100}
        prefix={prefix}
        suffix={suffix}
        format={{
          style: "decimal",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
        style={styles.balanceText}
      />
    </View>
  );
}
