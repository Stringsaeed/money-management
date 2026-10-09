/** Currencies whose sign ships as an SVG glyph (`assets/currencies`) rather than a font character. */
const GLYPHS = { AED: "dirham", SAR: "riyal" } as const satisfies Record<string, string>;

const hasGlyph = (currency: string): currency is keyof typeof GLYPHS =>
  Object.hasOwn(GLYPHS, currency);
const hasSymbol = (currency: string): currency is keyof typeof SYMBOLS =>
  Object.hasOwn(SYMBOLS, currency);

/** Narrow symbols Hermes' Intl often reports only as the ISO code. */
const SYMBOLS = {
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
} as const satisfies Record<string, string>;

export type CurrencyGlyphName = (typeof GLYPHS)[keyof typeof GLYPHS];

/** Typographic minus — never a hyphen in front of money. */
export const MINUS = "−";

export type SignDisplay = "auto" | "always" | "never";

export interface AmountParts {
  /** `−`, `+` or empty. Sits before the currency sign: −Đ64.20. */
  readonly sign: "" | "+" | typeof MINUS;
  readonly glyph: CurrencyGlyphName | null;
  /** Text symbol when there is no glyph; the ISO code when no narrow symbol is known. */
  readonly symbol: string;
  /** Grouped integer digits, e.g. `12,480`. */
  readonly whole: string;
  /** Decimal separator plus digits, e.g. `.50`; empty for zero-decimal currencies like JPY. */
  readonly fraction: string;
}

export function currencyFractionDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

function currencySymbol(currency: string): string {
  if (hasSymbol(currency)) return SYMBOLS[currency];
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

function signFor(minor: number, signDisplay: SignDisplay): AmountParts["sign"] {
  if (signDisplay === "never" || minor === 0) return "";
  if (minor < 0) return MINUS;
  return signDisplay === "always" ? "+" : "";
}

/**
 * Decimal separator of a locale (the device locale when omitted). Derived from `format()`
 * because Hermes does not implement `Intl.NumberFormat.prototype.formatToParts`.
 */
export function decimalSeparator(locale?: string): string {
  try {
    const sample = new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(1.5);
    return sample.replace(/\d/g, "") || ".";
  } catch {
    return ".";
  }
}

interface SplitAmount {
  readonly whole: string;
  readonly fraction: string;
}

/** Splits a locale-formatted absolute amount at its decimal separator. */
function splitFormatted(value: number, digits: number): SplitAmount {
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  if (digits === 0) return { whole: formatted, fraction: "" };
  const at = formatted.lastIndexOf(decimalSeparator());
  if (at < 0) return { whole: formatted, fraction: "" };
  return { whole: formatted.slice(0, at), fraction: formatted.slice(at) };
}

/** Splits an amount in minor units into the pieces Trove sets separately. */
export function amountParts(
  minor: number,
  currency: string,
  signDisplay: SignDisplay = "auto",
): AmountParts {
  const digits = currencyFractionDigits(currency);
  const { whole, fraction } = splitFormatted(Math.abs(minor) / 10 ** digits, digits);
  const glyph = hasGlyph(currency) ? GLYPHS[currency] : null;
  return {
    sign: signFor(minor, signDisplay),
    glyph,
    symbol: glyph ? "" : currencySymbol(currency),
    whole,
    fraction,
  };
}

/**
 * Screen-reader text, e.g. "minus 64.20 USD". Built from our own parts: Hermes' Intl
 * renders `currencyDisplay: "name"` inconsistently (e.g. "US Dollar126.00").
 */
export function amountAccessibilityLabel(minor: number, currency: string): string {
  const { whole, fraction } = amountParts(minor, currency, "never");
  return `${minor < 0 ? "minus " : ""}${whole}${fraction} ${currency}`;
}
