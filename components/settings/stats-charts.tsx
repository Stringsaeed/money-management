import { Activity, useState } from "react";
import { View } from "react-native";
import { ChartBarIcon, TrendUpIcon } from "phosphor-react-native";

import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CategorySpendingDatum, MonthlyTrendDatum } from "@/hooks/use-chart-data";

import { CategorySpendingChart } from "./category-spending-chart";
import { TransactionTrendChart } from "./transaction-trend-chart";

type ChartTab = "spending" | "trend";

interface Props {
  categorySpending: CategorySpendingDatum[];
  monthlyTrend: MonthlyTrendDatum[];
}

export function StatsCharts({ categorySpending, monthlyTrend }: Props) {
  const [activeTab, setActiveTab] = useState<ChartTab>("spending");

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
