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

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  KRW: "₩",
  RUB: "₽",
  BRL: "R$",
  ZAR: "R",
  EGP: "E£",
  SAR: "﷼",
  AED: "د.إ",
} as const satisfies Record<string, string>;

/** Currencies whose symbol ships as an SVG glyph (see `assets/currencies`) instead of text. */
const CURRENCY_GLYPHS = {
  SAR: "riyal",
  AED: "dirham",
} as const satisfies Record<string, string>;

export type CurrencyGlyphKey = (typeof CURRENCY_GLYPHS)[keyof typeof CURRENCY_GLYPHS];

const hasGlyph = (currency: string): currency is keyof typeof CURRENCY_GLYPHS =>
  Object.hasOwn(CURRENCY_GLYPHS, currency);

export function currencyGlyph(currency: string): CurrencyGlyphKey | null {
  return hasGlyph(currency) ? CURRENCY_GLYPHS[currency] : null;
}

const hasKnownSymbol = (currency: string): currency is keyof typeof CURRENCY_SYMBOLS =>
  Object.hasOwn(CURRENCY_SYMBOLS, currency);

/** Narrow currency symbol (e.g. "$", "€"), falling back to the ISO code. Hermes' Intl often reports only the code. */
export function currencySymbol(currency: string): string {
  if (hasKnownSymbol(currency)) return CURRENCY_SYMBOLS[currency];
  try {
    const part = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((item) => item.type === "currency");
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}
