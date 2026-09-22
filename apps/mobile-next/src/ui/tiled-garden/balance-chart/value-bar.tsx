import { Rect } from "react-native-svg";

import type { ChartGeometry } from "./balance-chart-types";

export interface ValueBarProps {
  color: string;
  value: number;
  width: number;
  x: number;
  geometry: ChartGeometry;
}

export function ValueBar({ color, value, width, x, geometry }: ValueBarProps) {
  const valueY = geometry.yForValue(value);
  const y = Math.min(geometry.zeroY, valueY);
  const barHeight = Math.max(Math.abs(geometry.zeroY - valueY), value === 0 ? 0 : 1);

  return <Rect fill={color} height={barHeight} rx={3} width={width} x={x} y={y} />;
}
