import { format, parseISO } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/ui/icon";
import { BalanceChart } from "@/ui/tiled-garden/balance-chart";
import { colors, radius, space } from "@/ui/trove";
import { formatChartMoney } from "./home-display";
import type { HomeOverview, HomeOverviewRange } from "./home-model-types";

interface HomeChartPanelProps {
  readonly overview: HomeOverview;
  readonly mode: "line" | "bar";
  readonly range: HomeOverviewRange;
  readonly onMode: (mode: "line" | "bar") => void;
}

// Gap: Trove `BalanceChart` is balance-only and `ColumnChart` is spend-only, so the
// income/expense bar mode, the line/bar toggle and its `chart-bar` icon stay legacy.
export function HomeChartPanel({ overview, mode, range, onMode }: HomeChartPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.switcher}>
        {(["line", "bar"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${value === "line" ? "Line" : "Bar"} chart`}
            accessibilityState={{ selected: mode === value }}
            onPress={() => onMode(value)}
            style={[styles.switchButton, mode === value && styles.selected]}
          >
            <Icon
              name={value === "line" ? "chart-line-up" : "chart-bar"}
              color={colors.text.primary}
              size={20}
              weight={mode === value ? "bold" : "regular"}
            />
          </Pressable>
        ))}
      </View>
      <BalanceChart
        points={overview.points.map((point) => ({
          label: format(parseISO(point.date), range === "year" ? "MMM" : "d MMM"),
          balance: point.balanceMinor,
          income: point.incomeMinor,
          expense: point.expenseMinor,
        }))}
        mode={mode}
        height={128}
        accessibilityLabel={`${mode === "line" ? "Balance over time" : "Income and expenses"}, this ${range}, ${overview.currency}`}
        formatValue={(value) => formatChartMoney(value, overview.currency)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space[2] },
  switcher: {
    alignSelf: "flex-end",
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    flexDirection: "row",
    padding: space[0.5],
  },
  switchButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 44,
  },
  selected: { backgroundColor: colors.fill.selected },
});
