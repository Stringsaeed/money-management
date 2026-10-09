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

/** Splits an amount in minor units into the pieces Trove sets separately. */
export function amountParts(
  minor: number,
  currency: string,
  signDisplay: SignDisplay = "auto",
): AmountParts {
  const digits = currencyFractionDigits(currency);
  const value = Math.abs(minor) / 10 ** digits;
  const parts = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).formatToParts(value);
  let whole = "";
  let fraction = "";
  for (const part of parts) {
    if (part.type === "integer" || part.type === "group") whole += part.value;
    else if (part.type === "decimal" || part.type === "fraction") fraction += part.value;
  }
  const glyph = hasGlyph(currency) ? GLYPHS[currency] : null;
  return {
    sign: signFor(minor, signDisplay),
    glyph,
    symbol: glyph ? "" : currencySymbol(currency),
    whole,
    fraction,
  };
}

/** Screen-reader text, e.g. "minus 64.20 UAE dirhams" via Intl's long currency name. */
export function amountAccessibilityLabel(minor: number, currency: string): string {
  const digits = currencyFractionDigits(currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "name",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(minor / 10 ** digits);
  } catch {
    return `${minor / 10 ** digits} ${currency}`;
  }
}
