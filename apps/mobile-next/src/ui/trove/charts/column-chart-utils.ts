import { currencyFractionDigits } from "../amount";
import { COLUMN_PLOT_HEIGHT, COLUMN_TOP_INSET } from "./constants";
import { average, barHeights, columnDomainMax, formatDay, formatMoney, gridValues } from "./utils";

interface DatumLike {
  readonly date: string;
  readonly minor: number;
}

export interface ColumnTick {
  readonly value: number;
  /** Top offset of the gridline inside the chart. */
  readonly y: number;
  readonly label: string;
}

export interface ColumnScale {
  readonly heights: number[];
  readonly ticks: ColumnTick[];
  readonly average: number;
  readonly averageY: number;
}

/** Heights, gridlines and the average line for a column chart, all in chart coordinates. */
export function columnChartScale(data: readonly DatumLike[], currency: string): ColumnScale {
  const values = data.map((datum) => datum.minor);
  const minStep = 10 ** currencyFractionDigits(currency);
  const domainMax = columnDomainMax(values, minStep);
  const baselineY = COLUMN_TOP_INSET + COLUMN_PLOT_HEIGHT;
  const heightOf = (value: number) => barHeights([value], COLUMN_PLOT_HEIGHT, domainMax)[0] ?? 0;
  const mean = average(values);

  return {
    heights: barHeights(values, COLUMN_PLOT_HEIGHT, domainMax),
    ticks: gridValues(0, domainMax, 3, minStep).map((value) => ({
      value,
      y: baselineY - heightOf(value),
      label: formatMoney(value, currency, false),
    })),
    average: mean,
    averageY: baselineY - heightOf(mean),
  };
}

/** Screen-reader equivalent of the chart: headline numbers, then every day in order. */
export function columnChartSummary(
  data: readonly DatumLike[],
  currency: string,
  title: string,
  subtitle: string,
  currentLabel: string,
): string {
  if (data.length === 0) return `${title}, ${subtitle}. No spending.`;
  const peak = data.reduce((best, datum) => (datum.minor > best.minor ? datum : best));
  const days = data.map((datum, index) => {
    const name = index === data.length - 1 ? currentLabel : formatDay(datum.date);
    return `${name} ${formatMoney(datum.minor, currency)}`;
  });
  return [
    `${title}, ${subtitle}.`,
    `Average ${formatMoney(average(data.map((datum) => datum.minor)), currency, false)} a day.`,
    `Highest ${formatMoney(peak.minor, currency)} on ${formatDay(peak.date)}.`,
    `${days.join(", ")}.`,
  ].join(" ");
}
