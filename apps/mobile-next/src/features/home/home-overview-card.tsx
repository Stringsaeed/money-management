import { format, parseISO } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { spacing, typography } from "@/ui/design-tokens";
import { TilePanel } from "@/ui/tiled-garden/tile-panel";
import { BalanceChart } from "@/ui/tiled-garden/balance-chart";
import { tileColors, tileChartColors } from "@/ui/tiled-garden/tile-tokens";
import { formatMoneyMinor } from "@/utils/money";
import { formatChartMoney } from "./home-display";

interface HomeOverviewCardProps {
  readonly overview: {
    readonly balanceMinor: number;
    readonly incomeMinor: number;
    readonly expenseMinor: number;
    readonly currency: string;
    readonly points: readonly {
      date: string;
      balanceMinor: number;
      incomeMinor: number;
      expenseMinor: number;
    }[];
  };
  readonly mode: "line" | "bar";
  readonly range: "week" | "month" | "year";
  readonly accountLabel: string;
  readonly onMode: (mode: "line" | "bar") => void;
  readonly onRange: (range: "week" | "month" | "year") => void;
}

export function HomeOverviewCard({
  overview,
  mode,
  range,
  accountLabel,
  onMode,
  onRange,
}: HomeOverviewCardProps) {
  return (
    <TilePanel tone="olive" contentStyle={styles.panel}>
      <View style={styles.top}>
        <View style={styles.balanceCopy}>
          <Text style={styles.eyebrow}>THE BIG PICTURE</Text>
          <Text
            style={styles.balance}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.65}
          >
            {formatMoneyMinor(overview.balanceMinor, overview.currency)}
          </Text>
          <Text style={styles.caption}>
            {accountLabel} · {overview.currency}
          </Text>
        </View>
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
              <Text style={[styles.switchLabel, mode === value && styles.selectedLabel]}>
                {value === "line" ? "Line" : "Bars"}
              </Text>
            </Pressable>
          ))}
        </View>
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
      <View style={styles.periods}>
        {(["week", "month", "year"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: range === value }}
            accessibilityLabel={`This ${value}`}
            onPress={() => onRange(value)}
            style={[styles.period, range === value && styles.periodSelected]}
          >
            <Text style={styles.periodText}>
              {value === "week" ? "Week" : value === "month" ? "Month" : "Year"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.totals}>
        <View style={styles.total}>
          <View style={styles.legend}>
            <View style={styles.incomeDot} />
            <Text style={styles.caption}>MONEY IN</Text>
          </View>
          <Text style={styles.totalValue}>
            {formatMoneyMinor(overview.incomeMinor, overview.currency)}
          </Text>
        </View>
        <View style={styles.total}>
          <View style={styles.legend}>
            <View style={styles.expenseDot} />
            <Text style={styles.caption}>MONEY OUT</Text>
          </View>
          <Text style={styles.totalValue}>
            {formatMoneyMinor(overview.expenseMinor, overview.currency)}
          </Text>
        </View>
      </View>
    </TilePanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[2], padding: spacing[4] },
  top: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing[2] },
  balanceCopy: { flex: 1, minWidth: 120, gap: spacing[0.5] },
  eyebrow: {
    color: tileColors.ink,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 1.5,
  },
  balance: {
    color: tileColors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: typography.fontHeadingBlack,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.4,
  },
  caption: {
    color: tileColors.ink,
    fontSize: typography.textXs,
    lineHeight: 16,
    opacity: 0.78,
    fontFamily: typography.fontBodyMedium,
  },
  switcher: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 3,
    borderWidth: 1,
    borderColor: tileColors.grout,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  switchButton: {
    minHeight: 38,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderRadius: 8,
  },
  selected: { backgroundColor: tileColors.ink },
  switchLabel: {
    color: tileColors.ink,
    fontSize: typography.textXs,
    fontFamily: typography.fontBodyBold,
  },
  selectedLabel: { color: tileColors.cream },
  periods: { flexDirection: "row", alignSelf: "center", gap: spacing[1] },
  period: {
    minHeight: 36,
    paddingHorizontal: spacing[4],
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  periodSelected: { backgroundColor: "rgba(255,255,255,0.35)", borderColor: tileColors.grout },
  periodText: {
    color: tileColors.ink,
    fontSize: typography.textXs,
    fontFamily: typography.fontBodyBold,
  },
  totals: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: tileColors.grout,
    paddingTop: spacing[3],
    gap: spacing[3],
  },
  total: { flex: 1, gap: spacing[1] },
  legend: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  incomeDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: tileChartColors.income },
  expenseDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: tileChartColors.expense },
  totalValue: {
    color: tileColors.ink,
    fontFamily: typography.fontBodyBold,
    fontSize: typography.textLg,
    fontVariant: ["tabular-nums"],
  },
});
