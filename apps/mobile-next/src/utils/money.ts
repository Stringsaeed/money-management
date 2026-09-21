export function currencyFractionDigits(currency: string): number {
  return (
    new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function formatMoneyMinor(minor: number, currency: string): string {
  const fractionDigits = currencyFractionDigits(currency);
  const scale = 10 ** fractionDigits;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(minor / scale);
}

export function decimalFromMinor(minor: number, currency: string): string {
  const digits = currencyFractionDigits(currency);
  const sign = minor < 0 ? "-" : "";
  const absolute = Math.abs(minor);
  if (digits === 0) return `${sign}${absolute}`;
  const scale = 10 ** digits;
  const whole = Math.floor(absolute / scale);
  const fraction = String(absolute % scale)
    .padStart(digits, "0")
    .replace(/0+$/, "");
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

/** Parse a user-entered decimal without binary floating-point rounding. */
export function parseMoneyMinor(input: string, currency: string): number | null {
  const value = input.trim();
  if (value.includes(",")) return null;
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) return null;
  const fractionDigits = currencyFractionDigits(currency);
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  if (fraction.length > fractionDigits) return null;
  const minor =
    Number(`${whole}${fraction.padEnd(fractionDigits, "0")}`) * (value.startsWith("-") ? -1 : 1);
  return Number.isSafeInteger(minor) ? minor : null;
}
