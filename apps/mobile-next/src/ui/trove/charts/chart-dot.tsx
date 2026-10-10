import { Circle } from "react-native-svg";

import { colors } from "../tokens";

export interface ChartDotProps {
  x: number;
  y: number;
}

const RADIUS = 4;
const RING = 2;

/** Accent marker with a 2pt surface ring, drawn inside an `<Svg>`. */
export function ChartDot({ x, y }: ChartDotProps) {
  return (
    <Circle
      cx={x}
      cy={y}
      fill={colors.accent.fill}
      r={RADIUS}
      stroke={colors.surface.default}
      strokeWidth={RING}
    />
  );
}
