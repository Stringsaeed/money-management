import { currencyFractionDigits } from "../amount";
import { BALANCE_PAD_X, BALANCE_PLOT_HEIGHT, BALANCE_TOOLTIP_ROW } from "./constants";
import {
  buildAreaPath,
  buildLinePath,
  formatDay,
  formatMoney,
  gridValues,
  linearScale,
  type Point,
} from "./utils";

interface BalanceDatumLike {
  readonly date: string;
  readonly minor: number;
}

export interface BalanceGeometry {
  readonly points: Point[];
  readonly linePath: string;
  readonly areaPath: string;
  /** Top offsets of the horizontal gridlines. */
  readonly gridYs: number[];
  readonly baselineY: number;
}

const DOMAIN_PADDING = 0.1;

/** Pixel geometry for the balance line at a measured width. */
export function balanceGeometry(
  data: readonly BalanceDatumLike[],
  width: number,
  currency: string,
): BalanceGeometry {
  const values = data.map((datum) => datum.minor);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = (high - low) * DOMAIN_PADDING || Math.max(1, Math.abs(high) * DOMAIN_PADDING);
  const domain = [low - pad, high + pad] as const;
  const top = BALANCE_TOOLTIP_ROW;
  const baselineY = top + BALANCE_PLOT_HEIGHT;
  const y = linearScale(domain, [baselineY, top]);
  const x = linearScale([0, Math.max(1, data.length - 1)], [BALANCE_PAD_X, width - BALANCE_PAD_X]);
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const minStep = 10 ** currencyFractionDigits(currency);

  return {
    points,
    linePath: buildLinePath(points),
    areaPath: buildAreaPath(points, baselineY),
    gridYs: gridValues(domain[0], domain[1], 3, minStep).map(y),
    baselineY,
  };
}

/** Screen-reader equivalent: start, end, change and range of the period. */
export function balanceSummary(
  data: readonly BalanceDatumLike[],
  currency: string,
  title: string,
  subtitle: string,
): string {
  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last) return `${title}, ${subtitle}. No data.`;
  const values = data.map((datum) => datum.minor);
  const change = last.minor - first.minor;
  const direction =
    change === 0
      ? "unchanged"
      : `${change > 0 ? "up" : "down"} ${formatMoney(Math.abs(change), currency)}`;
  return [
    `${title}, ${subtitle}.`,
    `From ${formatMoney(first.minor, currency)} on ${formatDay(first.date)} to ${formatMoney(last.minor, currency)} today, ${direction}.`,
    `Lowest ${formatMoney(Math.min(...values), currency)}, highest ${formatMoney(Math.max(...values), currency)}.`,
  ].join(" ");
}
