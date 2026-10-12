import { amountParts } from "../amount/amount-parts";

const ZERO_FRACTION = /^\D0+$/;

/**
 * Unsigned figure that drops its decimals only when they are all zero: `1,988`, `75.50`.
 * Budget figures print the sign (if any) themselves.
 */
export function compactAmount(minor: number, currency: string): string {
  const parts = amountParts(Math.abs(minor), currency, "never");
  return ZERO_FRACTION.test(parts.fraction) ? parts.whole : `${parts.whole}${parts.fraction}`;
}

/** Unsigned whole units with grouping, decimals dropped: `1,320`. */
export function wholeAmount(minor: number, currency: string): string {
  return amountParts(Math.abs(minor), currency, "never").whole;
}
