import { Circle, G, Path } from "react-native-svg";

import { colors } from "@/ui/design-tokens";

import { tileChartColors } from "../tile-tokens";
import { safeNumber } from "./balance-chart-geometry";
import type { BalanceChartPoint, ChartGeometry } from "./balance-chart-types";

export interface LineChartProps {
  points: readonly BalanceChartPoint[];
  geometry: ChartGeometry;
  areaPath: string;
  linePath: string;
}

export function LineChart({ points, geometry, areaPath, linePath }: LineChartProps) {
  return (
    <G>
      {areaPath ? <Path d={areaPath} fill={tileChartColors.area} fillOpacity={0.3} /> : null}
      {linePath ? (
        <Path
          d={linePath}
          fill="none"
          stroke={tileChartColors.balance}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      ) : null}
      {points.map((point, index) =>
        points.length > 7 && index !== points.length - 1 ? null : (
          <Circle
            cx={geometry.xForIndex(index)}
            cy={geometry.yForValue(safeNumber(point.balance))}
            fill={colors.card}
            key={`${point.label}-${index}`}
            r={4}
            stroke={tileChartColors.balance}
            strokeWidth={2}
          />
        ),
      )}
    </G>
  );
}
