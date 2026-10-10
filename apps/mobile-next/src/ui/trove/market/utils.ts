export const SPARKLINE_WIDTH = 56;
export const SPARKLINE_HEIGHT = 24;

/** Padding the stroke needs so its round caps are not clipped. */
const INSET_X = 2;
const INSET_TOP = 3;
const INSET_BOTTOM = 3;

/**
 * Polyline path for a 56x24 sparkline, oldest value first. A flat series draws a flat line
 * along the bottom; fewer than two points draw nothing.
 */
export function sparklinePath(
  values: readonly number[],
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
): string {
  if (values.length < 2) return "";
  const low = Math.min(...values);
  const range = Math.max(...values) - low || 1;
  const plotWidth = width - INSET_X * 2;
  const plotHeight = height - INSET_TOP - INSET_BOTTOM;
  return values
    .map((value, index) => {
      const x = INSET_X + (index * plotWidth) / (values.length - 1);
      const y = height - INSET_BOTTOM - ((value - low) / range) * plotHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export type ChangeTone = "positive" | "negative" | "neutral";

const roundTenth = (percent: number): number =>
  Number.isFinite(percent) ? Math.round(percent * 10) / 10 : 0;

/** Sign decides the tone; anything that rounds to 0.0 is neutral. */
export function changeTone(percent: number): ChangeTone {
  const rounded = roundTenth(percent);
  if (rounded > 0) return "positive";
  if (rounded < 0) return "negative";
  return "neutral";
}

const formatMagnitude = (percent: number): string =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    Math.abs(roundTenth(percent)),
  );

const ARROWS = { positive: "\u25B2 ", negative: "\u25BC ", neutral: "" } as const satisfies Record<
  ChangeTone,
  string
>;

/** "▲ 2.4%", "▼ 1.1%", "0.0%" — the arrow replaces the sign. */
export function marketChangeLabel(percent: number): string {
  return `${ARROWS[changeTone(percent)]}${formatMagnitude(percent)}%`;
}

const SPOKEN = {
  positive: "up",
  negative: "down",
  neutral: "no change,",
} as const satisfies Record<ChangeTone, string>;

/** "up 2.4 percent", "down 1.1 percent", "no change, 0.0 percent". */
export function marketChangeSpoken(percent: number): string {
  return `${SPOKEN[changeTone(percent)]} ${formatMagnitude(percent)} percent`;
}
