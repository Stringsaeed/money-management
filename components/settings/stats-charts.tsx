import { Activity, useMemo, useState } from "react";
import { View } from "react-native";
import { ChartBarIcon, TrendUpIcon } from "phosphor-react-native";

import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategorySpending, useMonthlyTrend } from "@/hooks/use-chart-data";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";

import { CategorySpendingChart } from "./category-spending-chart";
import { TransactionTrendChart } from "./transaction-trend-chart";

type ChartTab = "spending" | "trend";

export function StatsCharts() {
  const [activeTab, setActiveTab] = useState<ChartTab>("spending");
  const { selectedYear, selectedMonth, activeAccountId, selectedCategoryId } = useUIStore();

  const { data: transactions = [] } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
    categoryId: selectedCategoryId,
  });

  const flatTransactions = useMemo(() => transactions, [transactions]);

  const categorySpending = useCategorySpending(flatTransactions);
  const monthlyTrend = useMonthlyTrend(flatTransactions);

  return (
    <View className="mx-5 mt-4">
      {/* Tab Switcher */}
      <View className="absolute top-2 right-2 z-10">
        <ToggleGroup
          type="single"
          className="bg-background "
          value={activeTab}
          onValueChange={(val) => {
            if (val) setActiveTab(val as ChartTab);
          }}
          variant="outline"
        >
          <ToggleGroupItem value="spending" isFirst>
            <ToggleGroupIcon as={ChartBarIcon} />
          </ToggleGroupItem>
          <ToggleGroupItem value="trend" isLast>
            <ToggleGroupIcon as={TrendUpIcon} />
          </ToggleGroupItem>
        </ToggleGroup>
      </View>

      <Activity mode={activeTab === "spending" ? "visible" : "hidden"}>
        <CategorySpendingChart data={categorySpending} />
      </Activity>
      <Activity mode={activeTab === "trend" ? "visible" : "hidden"}>
        <TransactionTrendChart data={monthlyTrend} />
      </Activity>
    </View>
  );
}
