import {
  PLOT_BOTTOM,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_TOP,
  type BalanceChartPoint,
  type ChartGeometry,
} from "./balance-chart-types";

export function getChartGeometry(
  points: readonly BalanceChartPoint[],
  mode: "line" | "bar",
  width: number,
  height: number,
): ChartGeometry {
  const values = points.flatMap((point) =>
    mode === "line"
      ? [safeNumber(point.balance)]
      : [safeNumber(point.income), safeNumber(point.expense)],
  );
  const finiteValues = values.filter(Number.isFinite);
  const rawMin = Math.min(0, ...(finiteValues.length > 0 ? finiteValues : [0]));
  const rawMax = Math.max(0, ...(finiteValues.length > 0 ? finiteValues : [0]));
  const rawRange = rawMax - rawMin;
  const padding = rawRange === 0 ? 1 : rawRange * 0.1;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = max - min || 1;
  const plotWidth = Math.max(40, width - PLOT_LEFT - PLOT_RIGHT);
  const plotHeight = Math.max(40, height - PLOT_TOP - PLOT_BOTTOM);
  const yForValue = (value: number) => {
    const clampedValue = Math.min(max, Math.max(min, safeNumber(value)));
    return PLOT_TOP + ((max - clampedValue) / range) * plotHeight;
  };
  const xForIndex = (index: number) => {
    if (points.length < 2) return PLOT_LEFT + plotWidth / 2;
    return PLOT_LEFT + (index / (points.length - 1)) * plotWidth;
  };

  return {
    min,
    max,
    range,
    plotHeight,
    plotWidth,
    zeroY: yForValue(0),
    xForIndex,
    yForValue,
  };
}

export function getLinePath(points: readonly BalanceChartPoint[], geometry: ChartGeometry): string {
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${geometry.xForIndex(index)} ${geometry.yForValue(point.balance)}`;
    })
    .join(" ");
}

export function getAreaPath(points: readonly BalanceChartPoint[], geometry: ChartGeometry): string {
  if (points.length === 0) return "";
  const firstX = geometry.xForIndex(0);
  const lastX = geometry.xForIndex(points.length - 1);
  const line = getLinePath(points, geometry);
  return `${line} L ${lastX} ${geometry.zeroY} L ${firstX} ${geometry.zeroY} Z`;
}

export function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function formatChartValue(value: number): string {
  return String(Math.round(value));
}
