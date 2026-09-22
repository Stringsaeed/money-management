import type { StyleProp, ViewStyle } from "react-native";

export interface BalanceChartPoint {
  label: string;
  balance: number;
  income: number;
  expense: number;
}

export interface BalanceChartProps {
  points: readonly BalanceChartPoint[];
  mode?: "line" | "bar";
  accessibilityLabel: string;
  height?: number;
  formatValue?: (value: number) => string;
  style?: StyleProp<ViewStyle>;
}

export interface ChartGeometry {
  min: number;
  max: number;
  range: number;
  plotHeight: number;
  plotWidth: number;
  zeroY: number;
  xForIndex: (index: number) => number;
  yForValue: (value: number) => number;
}

export const CHART_DEFAULT_HEIGHT = 220;
export const CHART_FALLBACK_WIDTH = 320;
export const PLOT_LEFT = 52;
export const PLOT_RIGHT = 12;
export const PLOT_TOP = 18;
export const PLOT_BOTTOM = 38;
