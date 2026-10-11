import { StyleSheet, View } from "react-native";

import {
  BalanceCard,
  Card,
  FlowChart,
  SegmentedControl,
  space,
  type FlowChartView,
  type SegmentOption,
} from "@/ui/trove";
import { homeFlowData, homeFlowRangeLabel } from "./home-flow-data";
import { HomeTotal } from "./home-total";
import type { HomeOverview, HomeOverviewRange } from "./home-model-types";

interface HomeOverviewCardProps {
  readonly overview: HomeOverview;
  readonly mode: FlowChartView;
  readonly range: HomeOverviewRange;
  readonly accountLabel: string;
  readonly onMode: (mode: FlowChartView) => void;
  readonly onRange: (range: HomeOverviewRange) => void;
}

const RANGE_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const satisfies readonly SegmentOption<HomeOverviewRange>[];

export function HomeOverviewCard({
  overview,
  mode,
  range,
  accountLabel,
  onMode,
  onRange,
}: HomeOverviewCardProps) {
  return (
    <View style={styles.stack}>
      <BalanceCard
        label="Overview"
        minor={overview.balanceMinor}
        currency={overview.currency}
        caption={`${accountLabel} · ${overview.currency}`}
      />
      <FlowChart
        data={homeFlowData(overview, range)}
        currency={overview.currency}
        rangeLabel={homeFlowRangeLabel(overview)}
        view={mode}
        onViewChange={onMode}
      />
      <SegmentedControl
        accessibilityLabel="Overview period"
        options={RANGE_OPTIONS}
        value={range}
        onChange={onRange}
      />
      <Card style={styles.totals}>
        <HomeTotal
          icon="income"
          label="Money in"
          minor={overview.incomeMinor}
          currency={overview.currency}
          direction="in"
        />
        <HomeTotal
          icon="expense"
          label="Money out"
          minor={overview.expenseMinor}
          currency={overview.currency}
          direction="out"
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[3] },
  totals: { flexDirection: "row", gap: space[3] },
});
