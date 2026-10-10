import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, space } from "../tokens";
import { FLOW_PLOT_HEIGHT } from "./constants";
import { FlowBars } from "./flow-bars";
import { flowChartScale, type FlowDatumLike } from "./flow-chart-utils";
import { FlowLines } from "./flow-lines";
import type { FlowChartView } from "./flow-view-toggle";

export interface FlowChartPlotProps {
  data: readonly FlowDatumLike[];
  currency: string;
  view: FlowChartView;
  plotWidth: number;
}

const LABEL_LIFT = 14;

/** Gridlines, y labels, either bars or lines, and the period labels at a measured width. */
export function FlowChartPlot({ data, currency, view, plotWidth }: FlowChartPlotProps) {
  const scale = flowChartScale(data, currency);

  return (
    <>
      {scale.ticks.map((tick) => (
        <View key={tick.value}>
          <View style={[styles.grid, { top: tick.y, width: plotWidth }]} />
          <Text
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={[styles.tickLabel, { top: tick.y - LABEL_LIFT }]}
            tone="tertiary"
            variant="stamp"
          >
            {tick.label}
          </Text>
        </View>
      ))}
      <View style={[styles.axis, { top: FLOW_PLOT_HEIGHT, width: plotWidth }]} />
      {view === "bar" ? (
        <FlowBars data={data} plotWidth={plotWidth} scale={scale} />
      ) : (
        <FlowLines data={data} plotWidth={plotWidth} scale={scale} />
      )}
      <View style={[styles.labels, { top: FLOW_PLOT_HEIGHT + space[2], width: plotWidth }]}>
        {data.map((datum) => (
          <Text
            key={datum.label}
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={styles.label}
            tone="tertiary"
            variant="stamp"
          >
            {datum.label}
          </Text>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  axis: { backgroundColor: colors.border.default, height: 1, left: 0, position: "absolute" },
  grid: { backgroundColor: colors.border.subtle, height: 1, left: 0, position: "absolute" },
  tickLabel: { position: "absolute", right: 0 },
  labels: { flexDirection: "row", left: 0, position: "absolute" },
  label: { flex: 1, textAlign: "center" },
});
