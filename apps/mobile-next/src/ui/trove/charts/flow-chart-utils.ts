import { currencyFractionDigits } from "../amount";
import { FLOW_BAR_GAP, FLOW_MAX_BAR_WIDTH, FLOW_PLOT_HEIGHT } from "./constants";
import { barHeights, formatMoney, gridValues, linearScale, type Point } from "./utils";

export interface FlowDatumLike {
  /** Period name as printed under the plot, e.g. `May`. */
  readonly label: string;
  /** Money in for the period, minor units. */
  readonly incomeMinor: number;
  /** Money out for the period, minor units (positive). */
  readonly expenseMinor: number;
}

/** The board leaves 6% above the tallest bar; there is no tooltip to make room for. */
export const FLOW_HEADROOM = 1.06;

const clean = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

/** Top of the shared scale: the tallest income or spending value plus 6%. */
export function flowDomainMax(data: readonly FlowDatumLike[], minStep = 1): number {
  const highest = Math.max(
    0,
    ...data.flatMap((datum) => [clean(datum.incomeMinor), clean(datum.expenseMinor)]),
  );
  return highest === 0 ? minStep : highest * FLOW_HEADROOM;
}

const trimDecimal = (value: number) => String(Math.round(value * 10) / 10);

/** Axis-label money: `500`, `5K`, `2.5K`, `1.2M`. No currency sign; the card names it. */
export function formatCompactMoney(minor: number, currency: string): string {
  const major = Math.abs(minor) / 10 ** currencyFractionDigits(currency);
  if (major >= 1_000_000) return `${trimDecimal(major / 1_000_000)}M`;
  if (major >= 1000) return `${trimDecimal(major / 1000)}K`;
  return String(Math.round(major));
}

export interface FlowTick {
  readonly value: number;
  /** Top offset of the gridline inside the plot. */
  readonly y: number;
  readonly label: string;
}

export interface FlowScale {
  readonly domainMax: number;
  readonly incomeHeights: number[];
  readonly expenseHeights: number[];
  readonly ticks: FlowTick[];
}

/** Bar heights and gridlines for both series on one shared scale, in plot coordinates. */
export function flowChartScale(
  data: readonly FlowDatumLike[],
  currency: string,
  plotHeight = FLOW_PLOT_HEIGHT,
): FlowScale {
  const minStep = 10 ** currencyFractionDigits(currency);
  const domainMax = flowDomainMax(data, minStep);
  const heightOf = (value: number) => barHeights([value], plotHeight, domainMax)[0] ?? 0;
  return {
    domainMax,
    incomeHeights: barHeights(
      data.map((datum) => datum.incomeMinor),
      plotHeight,
      domainMax,
    ),
    expenseHeights: barHeights(
      data.map((datum) => datum.expenseMinor),
      plotHeight,
      domainMax,
    ),
    ticks: gridValues(0, domainMax, 3, minStep).map((value) => ({
      value,
      y: plotHeight - heightOf(value),
      label: formatCompactMoney(value, currency),
    })),
  };
}

/** One bar of a pair: half the cell minus the gap and breathing room, capped at 12pt. */
export function flowBarWidth(cellWidth: number): number {
  const fit = Math.floor((cellWidth - FLOW_BAR_GAP - 8) / 2);
  return Math.max(2, Math.min(FLOW_MAX_BAR_WIDTH, fit));
}

/** Line vertices at the centre of each period's cell. */
export function flowLinePoints(
  values: readonly number[],
  plotWidth: number,
  domainMax: number,
  plotHeight = FLOW_PLOT_HEIGHT,
): Point[] {
  const cell = values.length > 0 ? plotWidth / values.length : 0;
  const y = linearScale([0, domainMax], [plotHeight, 0]);
  return values.map((value, index) => ({ x: cell * (index + 0.5), y: y(clean(value)) }));
}

/** Default stamp over the chart: `May – Oct · AED`. */
export function flowRangeLabel(data: readonly FlowDatumLike[], currency: string): string {
  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last) return currency;
  const span = first === last ? first.label : `${first.label} – ${last.label}`;
  return `${span} · ${currency}`;
}

const range = (values: readonly number[], currency: string) => {
  const low = Math.min(...values);
  const high = Math.max(...values);
  return low === high
    ? formatMoney(low, currency, false)
    : `between ${formatMoney(low, currency, false)} and ${formatMoney(high, currency, false)}`;
};

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** Screen-reader equivalent of the chart: ranges and totals per series, then every period. */
export function flowChartSummary(
  data: readonly FlowDatumLike[],
  currency: string,
  title: string,
  rangeLabel: string,
  incomeLabel: string,
  expenseLabel: string,
): string {
  if (data.length === 0) return `${title}, ${rangeLabel}. No data.`;
  const income = data.map((datum) => clean(datum.incomeMinor));
  const expense = data.map((datum) => clean(datum.expenseMinor));
  const periods = data.map(
    (datum, index) =>
      `${datum.label} ${incomeLabel.toLowerCase()} ${formatMoney(income[index] ?? 0, currency)}, ${expenseLabel.toLowerCase()} ${formatMoney(expense[index] ?? 0, currency)}`,
  );
  return [
    `${title}, ${rangeLabel}.`,
    `${incomeLabel} ${range(income, currency)}, total ${formatMoney(sum(income), currency, false)}.`,
    `${expenseLabel} ${range(expense, currency)}, total ${formatMoney(sum(expense), currency, false)}.`,
    `${periods.join("; ")}.`,
  ].join(" ");
}
