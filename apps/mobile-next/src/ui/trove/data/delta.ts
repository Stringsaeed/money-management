import { MINUS } from "../amount";

export type PercentTone = "positive" | "negative" | "neutral";
export type DeltaTone = PercentTone | "warning";

const roundTenth = (percent: number): number =>
  Number.isFinite(percent) ? Math.round(percent * 10) / 10 : 0;

const formatMagnitude = (magnitude: number): string =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    magnitude,
  );

/** Sign decides the tone; anything that rounds to 0.0 is neutral. */
export function deltaToneForPercent(percent: number): PercentTone {
  const rounded = roundTenth(percent);
  if (rounded > 0) return "positive";
  if (rounded < 0) return "negative";
  return "neutral";
}

/** "+2.6%", "−1.1%" (typographic minus), "0.0%". */
export function formatDeltaPercent(percent: number): string {
  const rounded = roundTenth(percent);
  const magnitude = formatMagnitude(Math.abs(rounded));
  if (rounded > 0) return `+${magnitude}%`;
  if (rounded < 0) return `${MINUS}${magnitude}%`;
  return `${magnitude}%`;
}

const DIRECTION_WORD = {
  positive: "up",
  negative: "down",
  neutral: "no change,",
} as const satisfies Record<PercentTone, string>;

/** Spoken form: "up 2.6 percent", "down 1.1 percent", "no change, 0.0 percent". */
export function deltaPercentAccessibilityLabel(percent: number): string {
  const rounded = roundTenth(percent);
  const word = DIRECTION_WORD[deltaToneForPercent(percent)];
  return `${word} ${formatMagnitude(Math.abs(rounded))} percent`;
}
