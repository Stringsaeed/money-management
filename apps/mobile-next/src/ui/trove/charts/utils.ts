import { format, parseISO } from "date-fns";

import { amountParts, currencyFractionDigits, MINUS } from "../amount";
import { CATEGORY_KEYS, type CategoryKey } from "../tokens";

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Steps a "nice" grid may take: 1, 2 or 5 times a power of ten. */
const STEP_MULTIPLIERS = [1, 2, 5, 10] as const;

/** Smallest 1/2/5 × 10ⁿ step that splits `range` into at most `maxCount` intervals. */
export function niceStep(range: number, maxCount: number, minStep = 1): number {
  if (!Number.isFinite(range) || range <= 0) return minStep;
  const magnitude = 10 ** Math.floor(Math.log10(range / maxCount));
  const step = STEP_MULTIPLIERS.map((multiplier) => multiplier * magnitude).find(
    (candidate) => range / candidate <= maxCount,
  );
  return Math.max(step ?? magnitude * 10, minStep);
}

/** Gridline values: multiples of a nice step strictly above `min` and not above `max`. */
export function gridValues(min: number, max: number, maxCount = 3, minStep = 1): number[] {
  if (!(max > min)) return [];
  const step = niceStep(max - min, maxCount, minStep);
  const values: number[] = [];
  for (let value = Math.floor(min / step) * step + step; value <= max; value += step) {
    if (value > min) values.push(value);
  }
  return values;
}

export const COLUMN_HEADROOM = 1.15;

/** Top of the column scale: the tallest value plus 15% headroom for the tooltip. */
export function columnDomainMax(values: readonly number[], minStep = 1): number {
  const highest = Math.max(0, ...values);
  return highest === 0 ? minStep : highest * COLUMN_HEADROOM;
}

/** Column heights in points; negatives and non-finite values draw nothing. */
export function barHeights(
  values: readonly number[],
  plotHeight: number,
  domainMax: number,
): number[] {
  if (!(domainMax > 0)) return values.map(() => 0);
  return values.map((value) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.min(plotHeight, Math.round((value / domainMax) * plotHeight));
  });
}

export function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export interface ColumnLayout {
  readonly cellWidth: number;
  readonly barWidth: number;
  /** Horizontal centre of column `index`, from the plot's left edge. */
  readonly centerX: (index: number) => number;
}

/** Equal cells across the plot; bars take 60% of a cell and never exceed `maxBarWidth`. */
export function columnLayout(count: number, plotWidth: number, maxBarWidth = 24): ColumnLayout {
  const cellWidth = count > 0 ? plotWidth / count : 0;
  return {
    cellWidth,
    barWidth: Math.max(2, Math.min(maxBarWidth, Math.round(cellWidth * 0.6))),
    centerX: (index) => cellWidth * (index + 0.5),
  };
}

/** Linear map from a domain to a range; a degenerate domain lands in the middle. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) return () => (r0 + r1) / 2;
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function buildLinePath(points: readonly Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${round1(point.x)} ${round1(point.y)}`)
    .join(" ");
}

/** Line path closed down to `baselineY` for the area wash. */
export function buildAreaPath(points: readonly Point[], baselineY: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return "";
  return `${buildLinePath(points)} L${round1(last.x)} ${round1(baselineY)} L${round1(first.x)} ${round1(baselineY)} Z`;
}

const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index));

/** Index of the column under `x` (measured from the chart's left edge). */
export function cellIndexFromX(x: number, left: number, plotWidth: number, count: number): number {
  if (count <= 0 || plotWidth <= 0) return 0;
  return clampIndex(Math.floor(((x - left) / plotWidth) * count), count);
}

/** Index of the line point nearest `x`; points sit on the plot's left and right edges. */
export function pointIndexFromX(x: number, left: number, plotWidth: number, count: number): number {
  if (count <= 1 || plotWidth <= 0) return 0;
  return clampIndex(Math.round(((x - left) / plotWidth) * (count - 1)), count);
}

export interface TooltipPlacement {
  readonly left: number;
  readonly top: number;
}

/**
 * Centres a tooltip on `anchorX` without leaving the container. With `anchorY` it floats
 * `gap` above that point; without it the tooltip stays pinned to the top edge.
 */
export function placeTooltip(
  anchorX: number,
  anchorY: number | null,
  size: { readonly width: number; readonly height: number },
  containerWidth: number,
  gap = 10,
): TooltipPlacement {
  const left = Math.max(0, Math.min(containerWidth - size.width, anchorX - size.width / 2));
  const top = anchorY === null ? 0 : Math.max(0, anchorY - gap - size.height);
  return { left, top };
}

/** Whole-unit rounding in minor units, so `Avg $56` rounds instead of truncating. */
const roundToMajor = (minor: number, currency: string) => {
  const unit = 10 ** currencyFractionDigits(currency);
  return Math.round(minor / unit) * unit;
};

/** Plain-text money for chart labels: `$1,284`, `−$12.50`; AED/SAR fall back to the ISO code. */
export function formatMoney(minor: number, currency: string, withFraction = true): string {
  const value = withFraction ? minor : roundToMajor(minor, currency);
  const parts = amountParts(Math.abs(value), currency, "never");
  const symbol = parts.symbol || currency;
  const spacer = /^[A-Z]{2,}$/.test(symbol) ? " " : "";
  const sign = value < 0 ? MINUS : "";
  return `${sign}${symbol}${spacer}${parts.whole}${withFraction ? parts.fraction : ""}`;
}

/** Share of the total as one-decimal percent text, e.g. `32.7%`. */
export function formatShare(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

/** `Oct 9` for an ISO date (`yyyy-MM-dd`). */
export function formatDay(isoDate: string): string {
  return format(parseISO(isoDate), "MMM d");
}

/** Signed percent change, or null when there is no base to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export type DeltaDirection = "up" | "down" | "flat";
export type DeltaTone = "positive" | "negative" | "neutral";

export function deltaDirection(change: number): DeltaDirection {
  const rounded = Math.round(change);
  if (rounded === 0) return "flat";
  return rounded > 0 ? "up" : "down";
}

/** Meaning, not direction, picks the color: for spending, down is good. */
export function deltaTone(change: number, lessIsGood = true): DeltaTone {
  const direction = deltaDirection(change);
  if (direction === "flat") return "neutral";
  const good = (direction === "down") === lessIsGood;
  return good ? "positive" : "negative";
}

export interface CategoryAmount {
  readonly id: string;
  readonly name: string;
  /** Spent amount in minor units. Zero and negative entries are ignored. */
  readonly minor: number;
  /** Pin a category to its design-system color; otherwise it takes the next free slot. */
  readonly colorKey?: CategoryKey;
}

export interface CategorySlice {
  readonly id: string;
  readonly name: string;
  readonly minor: number;
  readonly colorKey: CategoryKey;
  /** Fraction of the total, 0 to 1. */
  readonly share: number;
}

type SlotKey = Exclude<CategoryKey, "other">;
const SLOT_KEYS = CATEGORY_KEYS.filter((key): key is SlotKey => key !== "other");

const sumMinor = (items: readonly { readonly minor: number }[]) =>
  items.reduce((total, item) => total + item.minor, 0);

type PlacedCategory = CategoryAmount & { readonly colorKey: CategoryKey };

function assignSlots(visible: readonly CategoryAmount[]): PlacedCategory[] {
  const claimed = new Map<string, SlotKey>();
  const taken = new Set<SlotKey>();
  for (const item of visible) {
    const key = item.colorKey;
    if (key && key !== "other" && !taken.has(key)) {
      taken.add(key);
      claimed.set(item.id, key);
    }
  }
  const free = SLOT_KEYS.filter((key) => !taken.has(key));
  let next = 0;
  return visible.map((item) => ({
    ...item,
    colorKey: claimed.get(item.id) ?? free[next++] ?? "other",
  }));
}

/**
 * Keeps the `maxVisible` largest categories (at most six), gives each its fixed slot
 * color, orders them by slot, and folds everything else into a trailing Other slice.
 */
export function foldCategories(
  items: readonly CategoryAmount[],
  maxVisible = SLOT_KEYS.length,
): CategorySlice[] {
  const positive = items.filter((item) => item.minor > 0);
  const total = sumMinor(positive);
  if (total === 0) return [];

  const ranked = [...positive].sort((a, b) => b.minor - a.minor);
  const visible = ranked
    .filter((item) => item.colorKey !== "other")
    .slice(0, Math.min(maxVisible, SLOT_KEYS.length));
  const visibleIds = new Set(visible.map((item) => item.id));
  const otherMinor = sumMinor(positive.filter((item) => !visibleIds.has(item.id)));

  const slices: CategorySlice[] = assignSlots(visible)
    .sort((a, b) => CATEGORY_KEYS.indexOf(a.colorKey) - CATEGORY_KEYS.indexOf(b.colorKey))
    .map((item) => ({ ...item, share: item.minor / total }));
  if (otherMinor > 0) {
    slices.push({
      id: "other",
      name: "Other",
      minor: otherMinor,
      colorKey: "other",
      share: otherMinor / total,
    });
  }
  return slices;
}

export function categorySummary(slices: readonly CategorySlice[], currency: string): string {
  return slices
    .map(
      (slice) =>
        `${slice.name} ${formatMoney(slice.minor, currency)}, ${Math.round(slice.share * 100)} percent`,
    )
    .join("; ");
}

export interface DeltaPresentation {
  readonly direction: DeltaDirection;
  readonly tone: DeltaTone;
  /** Pill text, e.g. `8% vs Sep`. */
  readonly label: string;
  /** Screen-reader phrase, e.g. `down 8% vs Sep`. */
  readonly spoken: string;
}

/** Everything the stat tile prints about a change; null without a comparison. */
export function presentDelta(
  changePercent: number | undefined,
  changeLabel: string,
  lessIsGood: boolean,
): DeltaPresentation | null {
  if (changePercent === undefined) return null;
  const direction = deltaDirection(changePercent);
  const label = `${Math.abs(Math.round(changePercent))}% ${changeLabel}`.trim();
  return {
    direction,
    tone: deltaTone(changePercent, lessIsGood),
    label,
    spoken: `${direction === "flat" ? "unchanged" : direction} ${label}`,
  };
}
