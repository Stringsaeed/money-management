import { StyleSheet, View } from "react-native";

import { colors } from "@/ui/trove";

import { homeBarHeight, HOME_PLOT_HEIGHT } from "./home-chart-scale";
import type { HomeMonthFlow } from "./home-summary";

interface HomeFlowBarsProps {
  readonly months: readonly HomeMonthFlow[];
  readonly domain: number;
}

/** One income and one spending column per month, 3pt rounded tops on the axis rule. */
export function HomeFlowBars({ months, domain }: HomeFlowBarsProps) {
  return (
    <View style={styles.plot}>
      {months.map((month) => (
        <View key={month.month} style={styles.cell}>
          <View
            style={[
              styles.bar,
              styles.income,
              { height: homeBarHeight(month.incomeMinor, domain) },
            ]}
          />
          <View
            style={[
              styles.bar,
              styles.spend,
              { height: homeBarHeight(month.expenseMinor, domain) },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: "row", height: HOME_PLOT_HEIGHT },
  cell: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    gap: 2,
    justifyContent: "center",
  },
  bar: { borderTopLeftRadius: 3, borderTopRightRadius: 3, width: 11 },
  income: { backgroundColor: colors.positive.text },
  spend: { backgroundColor: colors.chartSpend },
});
