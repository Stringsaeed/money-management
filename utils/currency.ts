/**
 * Format an integer number of cents as a localized currency string.
 * e.g. formatCents(1099, "USD") → "$10.99"
 */
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export interface CurrencyAffixes {
  prefix: string;
  suffix: string;
}

/**
 * Splits a currency's formatting into the text that sits before and after the
 * number — e.g. USD in en-US → `{ prefix: "$", suffix: "" }`, EUR in de-DE →
 * `{ prefix: "", suffix: " €" }`.
 *
 * Needed because animated number rendering must be handed a plain decimal:
 * number-flow's Hermes fallback parser scans the whole formatted string for an
 * "E" to detect scientific notation, so a currency rendered as a code rather
 * than a symbol — AED, SEK — gets torn apart ("AED 32,200.00" becomes
 * "A × 10³²²⁰⁰⁰⁰"). Formatting the number separately and re-attaching these
 * affixes keeps that parser away from the currency text entirely.
 *
 * Works by locating the locale's own rendering of zero inside the currency
 * string, so it is agnostic to numbering system, separator and placement.
 */
export function currencyAffixes(currency = "USD", locale?: string): CurrencyAffixes {
  const options = { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false };

  const withCurrency = new Intl.NumberFormat(locale, {
    ...options,
    style: "currency",
    currency,
  }).format(0);

  const bare = new Intl.NumberFormat(locale, { ...options, style: "decimal" }).format(0);

  const at = withCurrency.indexOf(bare);

  // Defensive: if the two formatters disagree, show the code ahead of the
  // number rather than dropping the currency altogether.
  if (at === -1) return { prefix: `${currency} `, suffix: "" };

  return {
    prefix: withCurrency.slice(0, at),
    suffix: withCurrency.slice(at + bare.length),
  };
}

/**
 * Format cents as a plain decimal string (no currency symbol).
 * e.g. centsToDecimalString(1099) → "10.99"
 */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert a decimal string (e.g. "10.99" or "1,099.50") to integer cents.
 * Strips non-numeric characters except the decimal point.
 * Returns 0 for invalid input.
 */
export function decimalStringToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
