import { G } from "react-native-svg";

import { tileChartColors } from "../tile-tokens";
import { safeNumber } from "./balance-chart-geometry";
import { ValueBar } from "./value-bar";
import type { BalanceChartPoint, ChartGeometry } from "./balance-chart-types";

export interface BarChartProps {
  points: readonly BalanceChartPoint[];
  geometry: ChartGeometry;
}

export function BarChart({ points, geometry }: BarChartProps) {
  const groupWidth = points.length > 0 ? geometry.plotWidth / points.length : geometry.plotWidth;
  const barWidth = Math.max(2, Math.min(18, groupWidth * 0.22));

  return (
    <G>
      {points.map((point, index) => {
        const center = geometry.xForIndex(index);
        return (
          <G key={`${point.label}-${index}`}>
            <ValueBar
              color={tileChartColors.income}
              value={safeNumber(point.income)}
              width={barWidth}
              x={center - barWidth - 1}
              geometry={geometry}
            />
            <ValueBar
              color={tileChartColors.expense}
              value={safeNumber(point.expense)}
              width={barWidth}
              x={center + 1}
              geometry={geometry}
            />
          </G>
        );
      })}
    </G>
  );
}
