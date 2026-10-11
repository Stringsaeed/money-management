import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { ChartCard } from "./chart-card";
import { columnChartSummary } from "./column-chart-utils";
import { ColumnChartPlot } from "./column-chart-plot";
import { COLUMN_TOTAL_HEIGHT, COLUMN_Y_GUTTER } from "./constants";
import { useScrub } from "./use-scrub";
import { cellIndexFromX } from "./utils";

export interface ColumnChartDatum {
  /** ISO date, `yyyy-MM-dd`. */
  date: string;
  /** Spent that day in minor units. */
  minor: number;
}

export interface ColumnChartProps {
  /** Oldest first. The last entry is the current period and takes the accent. */
  data: readonly ColumnChartDatum[];
  currency: string;
  title?: string;
  subtitle?: string;
  /** Tooltip name for the last column. */
  currentLabel?: string;
}

/**
 * Daily spending columns: neutral past periods, accent for the current one, an average
 * line, and a tooltip that follows a horizontal drag and returns to the current period.
 */
export function ColumnChart({
  data,
  currency,
  title = "Daily spending",
  subtitle = `Last ${data.length} days`,
  currentLabel = "Today",
}: ColumnChartProps) {
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(0, width - COLUMN_Y_GUTTER);
  const scrub = useScrub((x) => cellIndexFromX(x, 0, plotWidth, data.length));
  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <ChartCard subtitle={subtitle} title={title}>
      <GestureDetector gesture={scrub.gesture}>
        <View
          accessibilityLabel={columnChartSummary(data, currency, title, subtitle, currentLabel)}
          accessibilityRole="image"
          accessible
          onLayout={handleLayout}
          style={styles.chart}
        >
          {width > 0 ? (
            <ColumnChartPlot
              chartWidth={width}
              currency={currency}
              currentLabel={currentLabel}
              data={data}
              plotWidth={plotWidth}
              selected={scrub.index ?? data.length - 1}
            />
          ) : null}
        </View>
      </GestureDetector>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  chart: { height: COLUMN_TOTAL_HEIGHT, width: "100%" },
});
