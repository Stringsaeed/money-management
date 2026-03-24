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
 * Sum balances across accounts and return the total in cents with a currency code.
 * Falls back to "USD" when the list is empty.
 */
export function computeTotalBalance(accounts: { balance: number; currency: string }[]): {
  totalCents: number;
  currency: string;
} {
  const currency = accounts[0]?.currency ?? "USD";
  const totalCents = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  return { totalCents, currency };
}
