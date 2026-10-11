import { addMonths, format, parseISO, startOfDay, startOfMonth, subMonths } from "date-fns";
import type { V2HomeOverviewBuckets } from "@trove/api/v2/contracts";

/** Home's income vs spending card covers the current month and the five before it. */
export const HOME_CHART_MONTHS = 6;

const DATE_ONLY = "yyyy-MM-dd";
const MONTH_KEY = "yyyy-MM";

export interface HomeMonthFlow {
  /** `yyyy-MM`. */
  readonly month: string;
  /** Three-letter stamp printed on the card, e.g. `OCT`. */
  readonly label: string;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
}

export interface HomeNetWorth {
  /** Balance through today across the selected accounts. */
  readonly balanceMinor: number;
  /** Change since the end of last month. */
  readonly deltaMinor: number;
}

export interface HomeSummary {
  readonly months: readonly HomeMonthFlow[];
  readonly netWorth: HomeNetWorth;
}

/** The overview request window: the first day of the oldest charted month through today. */
export function homeChartWindow(now = new Date()) {
  const today = startOfDay(now);
  return {
    from: format(startOfMonth(subMonths(today, HOME_CHART_MONTHS - 1)), DATE_ONLY),
    to: format(today, DATE_ONLY),
  };
}

/**
 * Folds the server's daily buckets into the six charted months, and replays the running balance
 * for net worth and its change since last month ended.
 */
export function homeSummary(data: V2HomeOverviewBuckets, now = new Date()): HomeSummary {
  const { from } = homeChartWindow(now);
  const currentMonth = format(now, MONTH_KEY);
  const first = parseISO(from);
  const months = Array.from({ length: HOME_CHART_MONTHS }, (_, index) => {
    const date = addMonths(first, index);
    return {
      month: format(date, MONTH_KEY),
      label: format(date, "MMM").toUpperCase(),
      incomeMinor: 0,
      expenseMinor: 0,
    };
  });
  const byMonth = new Map(months.map((month) => [month.month, month]));
  let balanceMinor = data.openingBalanceMinor;
  let balanceAtMonthStartMinor = data.openingBalanceMinor;
  for (const bucket of data.buckets) {
    const key = bucket.date.slice(0, 7);
    balanceMinor += bucket.deltaMinor;
    if (key < currentMonth) balanceAtMonthStartMinor += bucket.deltaMinor;
    const month = byMonth.get(key);
    if (!month) continue;
    month.incomeMinor += bucket.incomeMinor;
    month.expenseMinor += bucket.expenseMinor;
  }
  return {
    months,
    netWorth: { balanceMinor, deltaMinor: balanceMinor - balanceAtMonthStartMinor },
  };
}

/** Stamp over the chart title: `MAY – OCT · AED`. */
export function homeChartRangeLabel(months: readonly HomeMonthFlow[], currency: string): string {
  const first = months[0];
  const last = months[months.length - 1];
  if (!first || !last) return currency;
  return `${first.label} – ${last.label} · ${currency}`;
}

/** Legend tail under the chart: `MAY → OCT`. */
export function homeChartSpanLabel(months: readonly HomeMonthFlow[]): string {
  const first = months[0];
  const last = months[months.length - 1];
  return first && last ? `${first.label} → ${last.label}` : "";
}
