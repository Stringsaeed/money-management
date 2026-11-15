import { amountParts, compactAmount, MINUS } from "@/ui/trove";

/** Receipt figure with its decimals and sign, no currency: `1,500.00`, `−1,012.00`. */
export function receiptFigure(minor: number, currency: string): string {
  const parts = amountParts(minor, currency);
  return `${parts.sign}${parts.whole}${parts.fraction}`;
}

/** Compact figure that keeps a minus: `588`, `−175`, `75.50`. */
export function signedCompact(minor: number, currency: string): string {
  return `${minor < 0 ? MINUS : ""}${compactAmount(minor, currency)}`;
}

/** The currency code and the compact figure, as buttons and banners print it: `AED 175`. */
export function codeAmount(minor: number, currency: string): string {
  return `${currency} ${compactAmount(minor, currency)}`;
}
