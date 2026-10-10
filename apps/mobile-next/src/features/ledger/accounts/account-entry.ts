/**
 * Opening-balance entry helpers. The Trove keypad keeps the entry as a plain decimal string
 * ("12.5"), so it can be parsed into minor units without floating-point rounding.
 */

/** Largest whole-number length the opening balance keypad accepts. */
export const MAX_ENTRY_INTEGER_DIGITS = 12;

/** Normalize a keypad entry ("12." / "") into a string parseMoneyMinor accepts. */
export function normalizeEntry(entry: string): string {
  const trimmed = entry.endsWith(".") ? entry.slice(0, -1) : entry;
  return trimmed || "0";
}

/** Drop fraction digits the (new) currency cannot represent, e.g. switching USD to JPY. */
export function fitEntryToPrecision(entry: string, fractionDigits: number): string {
  const [whole = "", fraction] = entry.split(".");
  if (fraction === undefined) return entry;
  if (fractionDigits === 0) return whole;
  return `${whole}.${fraction.slice(0, fractionDigits)}`;
}
