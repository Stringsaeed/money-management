import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius, space } from "../tokens";
import { ChartDateRow } from "./chart-date-row";
import { ChartTooltip } from "./chart-tooltip";
import { columnChartScale } from "./column-chart-utils";
import { ColumnBar } from "./column-bar";
import { COLUMN_PLOT_HEIGHT, COLUMN_TOP_INSET } from "./constants";
import { columnLayout, formatDay, formatMoney } from "./utils";
import type { ColumnChartDatum } from "./column-chart";

export interface ColumnChartPlotProps {
  data: readonly ColumnChartDatum[];
  currency: string;
  /** Column whose tooltip is showing: the scrub position, or the current period. */
  selected: number;
  plotWidth: number;
  /** Full chart width, which bounds the tooltip. */
  chartWidth: number;
  currentLabel: string;
}

const BASELINE_Y = COLUMN_TOP_INSET + COLUMN_PLOT_HEIGHT;
const LABEL_LIFT = 17;

/** Gridlines, columns, average line, date labels and tooltip at a measured width. */
export function ColumnChartPlot({
  data,
  currency,
  selected,
  plotWidth,
  chartWidth,
  currentLabel,
}: ColumnChartPlotProps) {
  const layout = columnLayout(data.length, plotWidth);
  const scale = columnChartScale(data, currency);
  const picked = data[selected];
  const first = data[0];
  const last = data[data.length - 1];
  const selectedHeight = scale.heights[selected] ?? 0;

  return (
    <>
      <View style={[styles.axis, { top: BASELINE_Y, width: plotWidth }]} />
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
      {data.map((datum, index) => (
        <ColumnBar
          baselineY={BASELINE_Y}
          height={scale.heights[index] ?? 0}
          highlighted={index === selected}
          key={datum.date}
          left={layout.centerX(index) - layout.barWidth / 2}
          width={layout.barWidth}
        />
      ))}
      <View style={[styles.average, { top: scale.averageY, width: plotWidth }]} />
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.averageLabel, { top: scale.averageY - LABEL_LIFT }]}
        tone="secondary"
        variant="labelSm"
      >
        {`Avg ${formatMoney(scale.average, currency, false)}`}
      </Text>
      {first && last ? (
        <ChartDateRow
          from={first.date}
          style={{ top: BASELINE_Y + space[2], width: plotWidth }}
          to={last.date}
        />
      ) : null}
      {picked ? (
        <ChartTooltip
          anchorX={layout.centerX(selected)}
          anchorY={BASELINE_Y - selectedHeight}
          containerWidth={chartWidth}
          label={selected === data.length - 1 ? currentLabel : formatDay(picked.date)}
          value={formatMoney(picked.minor, currency)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  axis: { backgroundColor: colors.chart.axis, height: 1, left: 0, position: "absolute" },
  grid: { backgroundColor: colors.border.subtle, height: 1, left: 0, position: "absolute" },
  tickLabel: { position: "absolute", right: 0 },
  average: {
    borderColor: colors.text.tertiary,
    borderTopWidth: 1,
    left: 0,
    position: "absolute",
  },
  averageLabel: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.xs,
    left: 0,
    paddingHorizontal: space[1],
    position: "absolute",
  },
});
