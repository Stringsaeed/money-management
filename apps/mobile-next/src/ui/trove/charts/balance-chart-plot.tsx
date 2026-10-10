import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors, space } from "../tokens";
import { balanceGeometry } from "./balance-chart-utils";
import type { BalanceChartDatum } from "./balance-chart";
import { ChartDateRow } from "./chart-date-row";
import { ChartDot } from "./chart-dot";
import { ChartTooltip } from "./chart-tooltip";
import { BALANCE_TOOLTIP_ROW, BALANCE_TOTAL_HEIGHT } from "./constants";
import { formatDay, formatMoney } from "./utils";

export interface BalanceChartPlotProps {
  data: readonly BalanceChartDatum[];
  currency: string;
  width: number;
  /** Point under the finger; null at rest, when the tooltip sits on today. */
  scrubIndex: number | null;
  currentLabel: string;
}

const LINE_WIDTH = 2;
const WASH_OPACITY = 0.1;

/** Line, wash, gridlines, crosshair, dots, date labels and tooltip at a measured width. */
export function BalanceChartPlot({
  data,
  currency,
  width,
  scrubIndex,
  currentLabel,
}: BalanceChartPlotProps) {
  const geometry = balanceGeometry(data, width, currency);
  const lastIndex = data.length - 1;
  const selected = scrubIndex ?? lastIndex;
  const point = geometry.points[selected];
  const end = geometry.points[lastIndex];
  const datum = data[selected];
  const first = data[0];
  const last = data[lastIndex];
  if (!point || !end || !datum || !first || !last) return null;

  return (
    <>
      <Svg height={BALANCE_TOTAL_HEIGHT} style={styles.svg} width={width}>
        {geometry.gridYs.map((y) => (
          <Path d={`M0 ${y}H${width}`} key={y} stroke={colors.border.subtle} strokeWidth={1} />
        ))}
        <Path d={geometry.areaPath} fill={colors.accent.fill} fillOpacity={WASH_OPACITY} />
        <Path
          d={geometry.linePath}
          fill="none"
          stroke={colors.accent.fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={LINE_WIDTH}
        />
        {scrubIndex === null ? null : (
          <>
            <Path
              d={`M${point.x} ${BALANCE_TOOLTIP_ROW}V${geometry.baselineY}`}
              stroke={colors.text.tertiary}
              strokeWidth={1}
            />
            <ChartDot x={point.x} y={point.y} />
          </>
        )}
        <ChartDot x={end.x} y={end.y} />
      </Svg>
      <ChartDateRow
        from={first.date}
        style={{ left: 0, right: 0, top: geometry.baselineY + space[2] }}
        to={last.date}
      />
      <ChartTooltip
        anchorX={point.x}
        containerWidth={width}
        label={selected === lastIndex ? currentLabel : formatDay(datum.date)}
        value={formatMoney(datum.minor, currency)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  svg: { position: "absolute" },
});
