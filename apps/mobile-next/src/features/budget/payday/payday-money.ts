import { amountParts, compactAmount, MINUS } from "@/ui/trove";
import { parseMoneyMinor } from "@/utils/money";

export interface FigureParts {
  /** Grouped whole units, e.g. `17,000`. */
  readonly whole: string;
  /** Separator and decimals, e.g. `.00`; empty for zero-decimal currencies. */
  readonly fraction: string;
}

/** A hero figure split for its faded decimals: `17,000` + `.00`. Unsigned. */
export function figureParts(minor: number, currency: string): FigureParts {
  const { whole, fraction } = amountParts(Math.abs(minor), currency, "never");
  return { whole, fraction };
}

/** The figure an amount being typed reads as; an empty or unreadable entry shows 0. */
export function entryFigure(text: string, currency: string): FigureParts & { empty: boolean } {
  const minor = parseMoneyMinor(text, currency);
  return { ...figureParts(minor ?? 0, currency), empty: minor === null || minor === 0 };
}

/** Receipt figure with its own minus: `1,988`, `−175`. */
export const signedCompact = (minor: number, currency: string): string =>
  `${minor < 0 ? MINUS : ""}${compactAmount(minor, currency)}`;

/** Figure with the currency code, as the boards print it in sentences: `AED 4,260`, `−AED 120`. */
export const codeAmount = (minor: number, currency: string): string =>
  `${minor < 0 ? MINUS : ""}${currency} ${compactAmount(minor, currency)}`;

/** Full figure with decimals and the code, as a balance prints: `AED 9,860.50`. */
export function codeBalance(minor: number, currency: string): string {
  const { whole, fraction } = figureParts(minor, currency);
  return `${minor < 0 ? MINUS : ""}${currency} ${whole}${fraction}`;
}
