import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { BalanceChartPlot } from "./balance-chart-plot";
import { balanceSummary } from "./balance-chart-utils";
import { ChartCard } from "./chart-card";
import { BALANCE_PAD_X, BALANCE_TOTAL_HEIGHT } from "./constants";
import { useScrub } from "./use-scrub";
import { pointIndexFromX } from "./utils";

export interface BalanceChartDatum {
  /** ISO date, `yyyy-MM-dd`. */
  date: string;
  /** Balance at the end of that day, minor units. */
  minor: number;
}

export interface BalanceChartProps {
  /** Oldest first. The last entry is today. */
  data: readonly BalanceChartDatum[];
  currency: string;
  title?: string;
  subtitle?: string;
  /** Tooltip name for the last point. */
  currentLabel?: string;
}

/**
 * Balance over time: a 2pt accent line over a 10% wash. Dragging scrubs a crosshair and
 * tooltip along the line; releasing snaps back to today.
 */
export function BalanceChart({
  data,
  currency,
  title = "Balance",
  subtitle = `Last ${data.length} days`,
  currentLabel = "Today",
}: BalanceChartProps) {
  const [width, setWidth] = useState(0);
  const scrub = useScrub((x) =>
    pointIndexFromX(x, BALANCE_PAD_X, width - BALANCE_PAD_X * 2, data.length),
  );
  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <ChartCard subtitle={subtitle} title={title}>
      <GestureDetector gesture={scrub.gesture}>
        <View
          accessibilityLabel={balanceSummary(data, currency, title, subtitle)}
          accessibilityRole="image"
          accessible
          onLayout={handleLayout}
          style={styles.chart}
        >
          {width > 0 ? (
            <BalanceChartPlot
              currency={currency}
              currentLabel={currentLabel}
              data={data}
              scrubIndex={scrub.index}
              width={width}
            />
          ) : null}
        </View>
      </GestureDetector>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  chart: { height: BALANCE_TOTAL_HEIGHT, width: "100%" },
});
