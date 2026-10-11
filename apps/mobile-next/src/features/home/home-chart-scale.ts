import type { HomeMonthFlow } from "./home-summary";

/** Plot height on the Home board; the axis rule sits under it. */
export const HOME_PLOT_HEIGHT = 96;
/** The board leaves about 6% above the tallest month. */
const HEADROOM = 1.06;
const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

/** Top of the shared income/spending scale, in minor units. */
export function homeChartDomain(months: readonly HomeMonthFlow[]): number {
  const highest = Math.max(
    0,
    ...months.flatMap((month) => [month.incomeMinor, month.expenseMinor]),
  );
  return highest > 0 ? highest * HEADROOM : 1;
}

/** Bar height in points for a value on a domain. */
export function homeBarHeight(value: number, domain: number): number {
  if (value <= 0 || domain <= 0) return 0;
  return Math.round((Math.min(value, domain) / domain) * HOME_PLOT_HEIGHT);
}

/** Y of a value inside the plot (0 at the top). */
export function homeLineY(value: number, domain: number): number {
  return HOME_PLOT_HEIGHT - homeBarHeight(Math.max(value, 0), domain);
}

/** Dashed guide values for the line view: a round step taken about three times under the top. */
export function homeGridValues(domain: number): number[] {
  if (domain <= 1) return [];
  const raw = domain / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (NICE_STEPS.find((candidate) => candidate * magnitude >= raw) ?? 10) * magnitude;
  return [step, step * 2].filter((value) => value < domain);
}

/** Height of a 10pt mono end label on the line view. */
export const HOME_LINE_LABEL_HEIGHT = 13;
const LABEL_DROP = 4;

/**
 * Tops for the two end labels on the line view. Each sits 4pt under its line's last point, as on
 * the board, but stays inside the plot; when the two would collide, the higher line's label
 * moves above its point instead.
 */
export function homeLineLabelTops(incomeY: number, spendY: number) {
  const max = HOME_PLOT_HEIGHT - HOME_LINE_LABEL_HEIGHT;
  const clamp = (top: number) => Math.min(Math.max(top, 0), max);
  let income = clamp(incomeY + LABEL_DROP);
  let spend = clamp(spendY + LABEL_DROP);
  if (Math.abs(income - spend) < HOME_LINE_LABEL_HEIGHT) {
    const above = (y: number) => clamp(y - LABEL_DROP - HOME_LINE_LABEL_HEIGHT);
    if (incomeY <= spendY) income = above(incomeY);
    else spend = above(spendY);
    if (Math.abs(income - spend) < HOME_LINE_LABEL_HEIGHT) {
      // Both pinned against the same edge: stack them.
      if (income <= spend) spend = clamp(income + HOME_LINE_LABEL_HEIGHT);
      else income = clamp(spend + HOME_LINE_LABEL_HEIGHT);
    }
  }
  return { income, spend };
}
