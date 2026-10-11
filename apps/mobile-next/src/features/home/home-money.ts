import { amountParts, type SignDisplay } from "@/ui/trove";

const ZERO_FRACTION = /^\D0+$/;

/**
 * Figure printed without a currency sign, as on Home's receipt lines and upcoming rows:
 * `−1,850.00`, `+12,000.00`. The section around it names the currency.
 */
export function plainAmount(minor: number, currency: string, signDisplay: SignDisplay = "auto") {
  const parts = amountParts(minor, currency, signDisplay);
  return `${parts.sign}${parts.whole}${parts.fraction}`;
}

/** Whole-unit figure that keeps its decimals only when they carry value: `1,988`, `75.50`. */
export function compactAmount(minor: number, currency: string) {
  const parts = amountParts(Math.abs(minor), currency, "never");
  return ZERO_FRACTION.test(parts.fraction) ? parts.whole : `${parts.whole}${parts.fraction}`;
}

/** Whole units (fraction dropped) with grouping, for markers and chart labels: `1,320`. */
export function wholeAmount(minor: number, currency: string) {
  return amountParts(Math.abs(minor), currency, "never").whole;
}
