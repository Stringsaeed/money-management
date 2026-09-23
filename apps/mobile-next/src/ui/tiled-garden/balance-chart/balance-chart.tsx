import { useState } from "react";
import { G, Line, Svg, Text as SvgText } from "react-native-svg";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { colors, typography } from "@/ui/design-tokens";

import { tileChartColors } from "../tile-tokens";
import {
  formatChartValue,
  getAreaPath,
  getChartGeometry,
  getLinePath,
  safeNumber,
} from "./balance-chart-geometry";
import {
  CHART_DEFAULT_HEIGHT,
  CHART_FALLBACK_WIDTH,
  PLOT_BOTTOM,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_TOP,
  type BalanceChartProps,
} from "./balance-chart-types";
import { BarChart } from "./bar-chart";
import { LineChart } from "./line-chart";

export type { BalanceChartPoint, BalanceChartProps } from "./balance-chart-types";

export function BalanceChart({
  points,
  mode = "line",
  accessibilityLabel,
  height = CHART_DEFAULT_HEIGHT,
  formatValue = formatChartValue,
  style,
}: BalanceChartProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const chartWidth = layoutWidth > 0 ? layoutWidth : CHART_FALLBACK_WIDTH;
  const chartHeight = Math.max(120, height);
  const geometry = getChartGeometry(points, mode, chartWidth, chartHeight);
  const labels = points.map((point) => point.label);
  const safePoints = points.map((point) => ({
    ...point,
    balance: safeNumber(point.balance),
    income: safeNumber(point.income),
    expense: safeNumber(point.expense),
  }));
  const linePath = getLinePath(safePoints, geometry);
  const areaPath = getAreaPath(safePoints, geometry);
  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== layoutWidth) setLayoutWidth(nextWidth);
  };

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      onLayout={handleLayout}
      style={[styles.container, style]}
    >
      <Svg height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} width={chartWidth}>
        <G>
          <Line
            stroke={tileChartColors.grid}
            strokeDasharray="2 4"
            strokeWidth={1}
            x1={PLOT_LEFT}
            x2={chartWidth - PLOT_RIGHT}
            y1={PLOT_TOP}
            y2={PLOT_TOP}
          />
          <Line
            stroke={tileChartColors.grid}
            strokeWidth={1}
            x1={PLOT_LEFT}
            x2={chartWidth - PLOT_RIGHT}
            y1={geometry.zeroY}
            y2={geometry.zeroY}
          />
          <Line
            stroke={tileChartColors.grid}
            strokeDasharray="2 4"
            strokeWidth={1}
            x1={PLOT_LEFT}
            x2={chartWidth - PLOT_RIGHT}
            y1={chartHeight - PLOT_BOTTOM}
            y2={chartHeight - PLOT_BOTTOM}
          />
          <SvgText
            fill={colors.mutedForeground}
            fontFamily={typography.fontBodyMedium}
            fontSize={10}
            textAnchor="end"
            x={PLOT_LEFT - 8}
            y={PLOT_TOP + 4}
          >
            {formatValue(geometry.max)}
          </SvgText>
          <SvgText
            fill={colors.mutedForeground}
            fontFamily={typography.fontBodyMedium}
            fontSize={10}
            textAnchor="end"
            x={PLOT_LEFT - 8}
            y={chartHeight - PLOT_BOTTOM + 4}
          >
            {formatValue(geometry.min)}
          </SvgText>
          {mode === "line" ? (
            <LineChart
              areaPath={areaPath}
              geometry={geometry}
              linePath={linePath}
              points={safePoints}
            />
          ) : (
            <BarChart geometry={geometry} points={safePoints} />
          )}
          {labels.length > 0 ? (
            <>
              <SvgText
                fill={colors.mutedForeground}
                fontFamily={typography.fontBodyMedium}
                fontSize={10}
                textAnchor="start"
                x={PLOT_LEFT}
                y={chartHeight - 12}
              >
                {labels[0]}
              </SvgText>
              {labels.length > 1 ? (
                <SvgText
                  fill={colors.mutedForeground}
                  fontFamily={typography.fontBodyMedium}
                  fontSize={10}
                  textAnchor="end"
                  x={chartWidth - PLOT_RIGHT}
                  y={chartHeight - 12}
                >
                  {labels[labels.length - 1]}
                </SvgText>
              ) : null}
            </>
          ) : (
            <SvgText
              fill={colors.mutedForeground}
              fontFamily={typography.fontBodyMedium}
              fontSize={12}
              textAnchor="middle"
              x={PLOT_LEFT + geometry.plotWidth / 2}
              y={PLOT_TOP + geometry.plotHeight / 2}
            >
              No data
            </SvgText>
          )}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
});
