import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { Text } from "../text";
import { space } from "../tokens";
import { ChartCard } from "./chart-card";
import { FLOW_TOTAL_HEIGHT, FLOW_Y_GUTTER } from "./constants";
import { flowChartSummary, flowRangeLabel, type FlowDatumLike } from "./flow-chart-utils";
import { FlowChartPlot } from "./flow-chart-plot";
import { FlowLegend } from "./flow-legend";
import { FlowViewToggle, type FlowChartView } from "./flow-view-toggle";

export type FlowChartDatum = FlowDatumLike;

export interface FlowChartProps {
  /** Oldest first. `label` is printed under the plot, so keep it to three or four characters. */
  data: readonly FlowChartDatum[];
  currency: string;
  /** Controlled view. Omit to let the chart keep its own. */
  view?: FlowChartView;
  /** Starting view when uncontrolled. */
  defaultView?: FlowChartView;
  onViewChange?: (view: FlowChartView) => void;
  title?: string;
  /** Stamp over the title. Defaults to `first – last · CURRENCY`. */
  rangeLabel?: string;
  incomeLabel?: string;
  expenseLabel?: string;
}

/**
 * Income against spending per period, as paired bars or two lines. Income takes
 * positive.text; spending stays neutral. The plot is one image for screen readers.
 */
export function FlowChart({
  data,
  currency,
  view,
  defaultView = "bar",
  onViewChange,
  title = "Income vs spending",
  rangeLabel,
  incomeLabel = "Income",
  expenseLabel = "Spending",
}: FlowChartProps) {
  const [ownView, setOwnView] = useState<FlowChartView>(defaultView);
  const [width, setWidth] = useState(0);
  const current = view ?? ownView;
  const range = rangeLabel ?? flowRangeLabel(data, currency);
  const plotWidth = Math.max(0, width - FLOW_Y_GUTTER);
  const handleView = (next: FlowChartView) => {
    setOwnView(next);
    onViewChange?.(next);
  };
  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <ChartCard>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text tone="tertiary" variant="stamp">
            {range}
          </Text>
          <Text accessibilityRole="header" variant="titleSm">
            {title}
          </Text>
        </View>
        <FlowViewToggle onChange={handleView} value={current} />
      </View>
      <FlowLegend expenseLabel={expenseLabel} incomeLabel={incomeLabel} />
      <View
        accessibilityLabel={flowChartSummary(
          data,
          currency,
          title,
          range,
          incomeLabel,
          expenseLabel,
        )}
        accessibilityRole="image"
        accessible
        onLayout={handleLayout}
        style={styles.chart}
      >
        {width > 0 ? (
          <FlowChartPlot currency={currency} data={data} plotWidth={plotWidth} view={current} />
        ) : null}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
  },
  heading: { flex: 1, minWidth: 0 },
  chart: { height: FLOW_TOTAL_HEIGHT, width: "100%" },
});
