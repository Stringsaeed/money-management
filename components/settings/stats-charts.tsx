import { Activity, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ChartBarIcon, TrendUpIcon } from "phosphor-react-native";

import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from "@/components/ui/toggle-group";

import { CategorySpendingChart } from "./category-spending-chart";
import { TransactionTrendChart } from "./transaction-trend-chart";
import { GlassSurface } from "../navigation/glass-tab-bar/glass-surface";

type ChartTab = "spending" | "trend";

export function StatsCharts() {
  const [activeTab, setActiveTab] = useState<ChartTab>("spending");

  return (
    <GlassSurface isInteractive={false} style={styles.container}>
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
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 8,
  },
});
