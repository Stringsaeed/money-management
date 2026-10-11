import type { HomeChartView } from "./home-chart-view";
import { wholeAmount } from "./home-money";
import type { HomeMonthFlow } from "./home-summary";

/** One sentence a screen reader gets for the whole plot: each month's income and spending. */
export function homeFlowSummary(
  months: readonly HomeMonthFlow[],
  currency: string,
  view: HomeChartView,
): string {
  if (months.length === 0) return "Income vs spending. No data yet.";
  const kind = view === "bar" ? "Bar chart" : "Line chart";
  const periods = months.map(
    (month, index) =>
      `${month.label} income ${wholeAmount(month.incomeMinor, currency)}, spending ${wholeAmount(month.expenseMinor, currency)}${index === months.length - 1 ? " so far" : ""}`,
  );
  return `${kind}, income vs spending in ${currency}. ${periods.join("; ")}.`;
}
