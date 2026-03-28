import { Activity, useState } from "react";
import { View } from "react-native";

import type { CategorySpendingDatum, MonthlyTrendDatum } from "@/hooks/use-chart-data";

import { CategorySpendingChart } from "./category-spending-chart";
import { ChartTabButton } from "./chart-tab-button";
import { TransactionTrendChart } from "./transaction-trend-chart";

type ChartTab = "spending" | "trend";

interface Props {
  categorySpending: CategorySpendingDatum[];
  monthlyTrend: MonthlyTrendDatum[];
}

export function StatsCharts({ categorySpending, monthlyTrend }: Props) {
  const [activeTab, setActiveTab] = useState<ChartTab>("spending");

  return (
    <View>
      {/* Tab Switcher */}
      <View className="flex-row mx-5 mt-4 border border-ledger-outline overflow-hidden">
        <ChartTabButton
          label="Spending"
          active={activeTab === "spending"}
          onPress={() => setActiveTab("spending")}
        />
        <View className="w-px bg-ledger-outline" />
        <ChartTabButton
          label="Trend"
          active={activeTab === "trend"}
          onPress={() => setActiveTab("trend")}
        />
      </View>

      {/* Chart */}
      <View className="mx-5 mt-3">
        <Activity mode={activeTab === "spending" ? "visible" : "hidden"}>
          <CategorySpendingChart data={categorySpending} />
        </Activity>
        <Activity mode={activeTab === "trend" ? "visible" : "hidden"}>
          <TransactionTrendChart data={monthlyTrend} />
        </Activity>
      </View>
    </View>
  );
}
