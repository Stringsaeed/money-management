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
/** Plex Mono advances 0.6em: 6pt per character at 10pt, plus 4pt padding each side. */
const LABEL_CHAR_WIDTH = 6;
const LABEL_PADDING = 8;
/** The labels hang 4pt past the plot's right edge, as on the board. */
const LABEL_OVERHANG = 4;
const LABEL_DROP = 4;
/** Clearance kept between a label and a line (half the 2.5pt stroke, plus breathing room). */
const LINE_CLEARANCE = 3;
const SAMPLES_PER_SEGMENT = 24;

export interface HomeLinePoint {
  readonly x: number;
  readonly y: number;
}

export interface HomeLineLabelInput {
  /** Plot width in points. */
  readonly width: number;
  readonly income: readonly HomeLinePoint[];
  readonly spend: readonly HomeLinePoint[];
  readonly incomeLabel: string;
  readonly spendLabel: string;
}

/** Estimated width of an end label chip, in points. */
export function homeLineLabelWidth(text: string): number {
  return text.length * LABEL_CHAR_WIDTH + LABEL_PADDING;
}

interface Box {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const inside = (box: Box, x: number, y: number) =>
  x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;

/** Sampled points of one segment that fall inside a box. */
function segmentCover(box: Box, from: HomeLinePoint, to: HomeLinePoint): number {
  if (Math.max(from.x, to.x) < box.left || Math.min(from.x, to.x) > box.right) return 0;
  let cover = 0;
  for (let step = 0; step <= SAMPLES_PER_SEGMENT; step += 1) {
    const t = step / SAMPLES_PER_SEGMENT;
    if (inside(box, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)) cover += 1;
  }
  return cover;
}

/** How much of the two lines a label box would cover, as a count of sampled points. */
function lineCover(box: Box, series: readonly (readonly HomeLinePoint[])[]): number {
  return series.reduce(
    (total, points) =>
      total +
      points.reduce((sum, to, index) => {
        const from = points[index - 1];
        return from ? sum + segmentCover(box, from, to) : sum;
      }, 0),
    0,
  );
}

/**
 * Tops for the two end labels on the line view. Each prefers 4pt under its line's last point, as
 * on the board, but takes the nearest spot inside the plot that covers the least of either line
 * and never overlaps the other label: a steep current month would otherwise run a line straight
 * through a label.
 */
export function homeLineLabelTops({
  width,
  income,
  spend,
  incomeLabel,
  spendLabel,
}: HomeLineLabelInput) {
  const series = [income, spend];
  const maxTop = HOME_PLOT_HEIGHT - HOME_LINE_LABEL_HEIGHT;
  const right = width + LABEL_OVERHANG;
  const place = (anchor: HomeLinePoint | undefined, text: string, taken: Box | null) => {
    const preferred = Math.min(Math.max((anchor?.y ?? maxTop) + LABEL_DROP, 0), maxTop);
    const left = right - homeLineLabelWidth(text);
    let best = { top: preferred, cover: Number.POSITIVE_INFINITY, distance: 0 };
    for (let top = 0; top <= maxTop; top += 1) {
      const box = { left, right, top, bottom: top + HOME_LINE_LABEL_HEIGHT };
      if (taken && box.top < taken.bottom && box.bottom > taken.top) continue;
      const padded = {
        left: box.left - LINE_CLEARANCE,
        right: box.right,
        top: box.top - LINE_CLEARANCE,
        bottom: box.bottom + LINE_CLEARANCE,
      };
      const cover = lineCover(padded, series);
      const distance = Math.abs(top - preferred);
      if (cover < best.cover || (cover === best.cover && distance < best.distance)) {
        best = { top, cover, distance };
      }
    }
    return {
      top: best.top,
      box: { left, right, top: best.top, bottom: best.top + HOME_LINE_LABEL_HEIGHT },
    };
  };
  const incomePlaced = place(income[income.length - 1], incomeLabel, null);
  const spendPlaced = place(spend[spend.length - 1], spendLabel, incomePlaced.box);
  return { income: incomePlaced.top, spend: spendPlaced.top };
}
