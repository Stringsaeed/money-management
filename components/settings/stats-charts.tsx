import { Activity, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ChartBarIcon, TrendUpIcon } from "phosphor-react-native";

import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from "@/components/ui/toggle-group";

import { CategorySpendingChart } from "./category-spending-chart";
import { TransactionTrendChart } from "./transaction-trend-chart";

type ChartTab = "spending" | "trend";

export function StatsCharts() {
  const [activeTab, setActiveTab] = useState<ChartTab>("spending");

  return (
    <View
      className="mx-5 mt-4 border-muted-foreground/20 p-2 rounded-lg bg-background"
      style={{
        borderCurve: "circular",
        boxShadow: "2px 2px 0px -1.5px rgba(0,0,0,0.01)",
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,0,0,0.1)",
      }}
    >
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
