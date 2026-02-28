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

/**
 * Apply an exchange rate (stored as rate * 1_000_000) to an amount in cents.
 * e.g. convertCents(100, 1084700) → 109 cents (€1.00 @ 1.0847 USD/EUR)
 */
export function convertCents(amountCents: number, rateTimesOneMillion: number): number {
  return Math.round((amountCents * rateTimesOneMillion) / 1_000_000);
}

/**
 * Parse a float exchange rate string to the integer storage format (rate * 1_000_000).
 * e.g. "1.0847" → 1084700
 */
export function rateStringToInt(rateStr: string): number {
  const rate = parseFloat(rateStr.replace(/[^0-9.]/g, ""));
  if (isNaN(rate) || rate <= 0) return 1_000_000; // default: 1:1
  return Math.round(rate * 1_000_000);
}

/**
 * Format the stored integer rate back to a readable decimal string.
 * e.g. 1084700 → "1.0847"
 */
export function rateIntToString(rateInt: number): string {
  return (rateInt / 1_000_000).toFixed(6).replace(/\.?0+$/, "");
}
