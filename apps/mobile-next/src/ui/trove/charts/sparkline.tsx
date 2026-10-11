import Svg, { Path } from "react-native-svg";

import { colors } from "../tokens";
import { ChartDot } from "./chart-dot";
import { buildLinePath, linearScale } from "./utils";

export interface SparklineProps {
  /** Oldest first; the last value gets the accent dot. */
  values: readonly number[];
  width?: number;
  height?: number;
}

const INSET = 4;
const LINE_WIDTH = 2;

/** Decorative trend line for stat tiles. */
export function Sparkline({ values, width = 120, height = 44 }: SparklineProps) {
  const x = linearScale([0, Math.max(1, values.length - 1)], [INSET, width - INSET]);
  const y = linearScale([Math.min(...values), Math.max(...values)], [height - INSET, INSET]);
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const end = points[points.length - 1];

  return (
    <Svg
      accessibilityElementsHidden
      height={height}
      importantForAccessibility="no-hide-descendants"
      width={width}
    >
      <Path
        d={buildLinePath(points)}
        fill="none"
        stroke={colors.chart.spark}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={LINE_WIDTH}
      />
      {end ? <ChartDot x={end.x} y={end.y} /> : null}
    </Svg>
  );
}
