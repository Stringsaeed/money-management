import { format, parseISO } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/ui/icon";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { BalanceChart } from "@/ui/tiled-garden/balance-chart";
import { TilePanel } from "@/ui/tiled-garden/tile-panel";
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
    <TilePanel contentStyle={styles.panel}>
      <View style={styles.top}>
        <View style={styles.balanceCopy}>
          <Text style={styles.eyebrow}>Overview</Text>
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
              <Icon
                name={value === "line" ? "chart-line-up" : "chart-bar"}
                color={mode === value ? tileColors.ink : colors.foreground}
                size={20}
                weight={mode === value ? "bold" : "regular"}
              />
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
            <Text style={[styles.periodText, range === value && styles.periodTextSelected]}>
              {value === "week" ? "Week" : value === "month" ? "Month" : "Year"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.totals}>
        <View
          accessible
          accessibilityLabel={`Money in ${formatMoneyMinor(overview.incomeMinor, overview.currency)}`}
          style={styles.total}
        >
          <Icon name="arrow-down-left" color={tileChartColors.income} size={18} weight="bold" />
          <Text style={[styles.totalValue, styles.incomeValue]}>
            {formatMoneyMinor(overview.incomeMinor, overview.currency)}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={`Money out ${formatMoneyMinor(overview.expenseMinor, overview.currency)}`}
          style={styles.total}
        >
          <Icon name="arrow-up-right" color={tileChartColors.expense} size={18} weight="bold" />
          <Text style={[styles.totalValue, styles.expenseValue]}>
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
    color: colors.foreground,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 1.5,
  },
  balance: {
    color: colors.foreground,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: typography.fontHeadingBlack,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.4,
  },
  caption: {
    color: colors.mutedForeground,
    fontSize: typography.textXs,
    lineHeight: 16,
    fontFamily: typography.fontBodyMedium,
  },
  switcher: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  switchButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  selected: { backgroundColor: tileColors.olive },
  periods: { flexDirection: "row", alignSelf: "center", gap: spacing[1] },
  period: {
    minHeight: 36,
    paddingHorizontal: spacing[4],
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  periodSelected: { backgroundColor: tileColors.olive, borderColor: tileColors.grout },
  periodText: {
    color: colors.foreground,
    fontSize: typography.textXs,
    fontFamily: typography.fontBodyBold,
  },
  totals: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    gap: spacing[3],
  },
  total: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing[2],
  },
  totalValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.textLg,
    fontVariant: ["tabular-nums"],
  },
  incomeValue: { color: tileChartColors.income },
  expenseValue: { color: colors.foreground },
  periodTextSelected: { color: tileColors.ink },
});
