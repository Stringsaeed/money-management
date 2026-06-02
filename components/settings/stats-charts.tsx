import { Activity, useState } from "react";
import { View } from "react-native";
import { ChartBarIcon, TrendUpIcon } from "phosphor-react-native";

import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from "@/components/ui/toggle-group";

import { CategorySpendingChart } from "./category-spending-chart";
import { TransactionTrendChart } from "./transaction-trend-chart";
import { useElevatedSurfaceStyle } from "./use-elevated-surface-style";

type ChartTab = "spending" | "trend";

export function StatsCharts() {
  const [activeTab, setActiveTab] = useState<ChartTab>("spending");
  const elevatedSurfaceStyle = useElevatedSurfaceStyle();

  return (
    <View className="mx-5 mt-4 rounded-lg bg-background p-2" style={elevatedSurfaceStyle}>
      {/* Tab Switcher */}
      <View className="self-end">
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
        <CategorySpendingChart />
      </Activity>
      <Activity mode={activeTab === "trend" ? "visible" : "hidden"}>
        <TransactionTrendChart />
      </Activity>
    </View>
  );
}
