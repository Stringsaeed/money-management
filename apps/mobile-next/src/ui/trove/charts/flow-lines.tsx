import { StyleSheet, type ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "../tokens";
import { FLOW_PLOT_HEIGHT } from "./constants";
import { FLOW_EXPENSE_COLOR, FLOW_INCOME_COLOR } from "./flow-series";
import { flowLinePoints, type FlowDatumLike, type FlowScale } from "./flow-chart-utils";
import { buildLinePath, type Point } from "./utils";

export interface FlowLinesProps {
  data: readonly FlowDatumLike[];
  scale: FlowScale;
  plotWidth: number;
}

const LINE_WIDTH = 2;
const DOT_RADIUS = 4;
const DOT_RING = 2;
/** Keeps the end dots and their rings inside the SVG. */
const OVERFLOW = DOT_RADIUS + DOT_RING;

/** Two 2pt lines through each period's centre, with a ringed dot on the latest period. */
export function FlowLines({ data, scale, plotWidth }: FlowLinesProps) {
  const income = flowLinePoints(
    data.map((datum) => datum.incomeMinor),
    plotWidth,
    scale.domainMax,
  );
  const expense = flowLinePoints(
    data.map((datum) => datum.expenseMinor),
    plotWidth,
    scale.domainMax,
  );

  return (
    <Svg
      height={FLOW_PLOT_HEIGHT + OVERFLOW * 2}
      style={styles.svg}
      width={plotWidth + OVERFLOW * 2}
    >
      <Series color={FLOW_INCOME_COLOR} points={income} />
      <Series color={FLOW_EXPENSE_COLOR} points={expense} />
    </Svg>
  );
}

function Series({ color, points }: { color: ColorValue; points: Point[] }) {
  const end = points[points.length - 1];
  return (
    <>
      <Path
        d={buildLinePath(points.map((point) => shift(point)))}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={LINE_WIDTH}
      />
      {end ? (
        <Circle
          cx={shift(end).x}
          cy={shift(end).y}
          fill={color}
          r={DOT_RADIUS}
          stroke={colors.surface.default}
          strokeWidth={DOT_RING}
        />
      ) : null}
    </>
  );
}

const shift = (point: Point): Point => ({ x: point.x + OVERFLOW, y: point.y + OVERFLOW });

const styles = StyleSheet.create({
  svg: { left: -OVERFLOW, position: "absolute", top: -OVERFLOW },
});
