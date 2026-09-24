/**
 * Keypad amount entry. The amount is kept as a plain decimal string ("12.5")
 * so it can be parsed into minor units without floating-point rounding.
 */

import { currencyGlyph, currencySymbol, type CurrencyGlyphKey } from "@/utils/money";

const MAX_INTEGER_DIGITS = 12;

export type AmountKey = `${number}` | "." | "delete";

export function appendAmountDigit(amount: string, digit: string, fractionDigits: number): string {
  const [whole = "", fraction] = amount.split(".");
  if (fraction !== undefined) return fraction.length >= fractionDigits ? amount : amount + digit;
  if (whole === "" || whole === "0") return digit;
  return whole.length >= MAX_INTEGER_DIGITS ? amount : amount + digit;
}

export function appendAmountDecimal(amount: string, fractionDigits: number): string {
  if (fractionDigits === 0 || amount.includes(".")) return amount;
  return `${amount || "0"}.`;
}

export function deleteAmountDigit(amount: string): string {
  const next = amount.slice(0, -1);
  return next === "0" ? "" : next;
}

export function applyAmountKey(amount: string, key: AmountKey, fractionDigits: number): string {
  if (key === "delete") return deleteAmountDigit(amount);
  if (key === ".") return appendAmountDecimal(amount, fractionDigits);
  return appendAmountDigit(amount, key, fractionDigits);
}

export interface AmountDisplayParts {
  readonly whole: string;
  readonly hasDecimal: boolean;
  readonly typedFraction: string;
  readonly pendingFraction: string;
}

/** Split an entry into display parts: grouped whole number plus typed/placeholder fraction. */
export function amountDisplayParts(amount: string, fractionDigits: number): AmountDisplayParts {
  const [whole = "", fraction] = amount.split(".");
  const typedFraction = fraction ?? "";
  return {
    whole: Number(whole || "0").toLocaleString("en-US"),
    hasDecimal: fraction !== undefined,
    typedFraction,
    pendingFraction: "0".repeat(Math.max(0, fractionDigits - typedFraction.length)),
  };
}

/** Normalize a keypad entry ("12." / "") into a string parseMoneyMinor accepts. */
export function normalizeAmountEntry(amount: string): string {
  const trimmed = amount.endsWith(".") ? amount.slice(0, -1) : amount;
  return trimmed || "0";
}

/** Drop fraction digits the (new) currency cannot represent, e.g. switching USD → JPY. */
export function fitAmountToPrecision(amount: string, fractionDigits: number): string {
  const [whole = "", fraction] = amount.split(".");
  if (fraction === undefined) return amount;
  if (fractionDigits === 0) return whole;
  return `${whole}.${fraction.slice(0, fractionDigits)}`;
}

const AMOUNT_FONT_SIZE = 64;
const MIN_AMOUNT_FONT_SIZE = 28;
const FULL_SIZE_CHARACTERS = 7;

/** Shrink the headline amount as it grows so long values ("$1,234,567.89") stay on one line. */
export function amountFontSize(characterCount: number): number {
  if (characterCount <= FULL_SIZE_CHARACTERS) return AMOUNT_FONT_SIZE;
  const scaled = Math.floor((AMOUNT_FONT_SIZE * FULL_SIZE_CHARACTERS) / characterCount);
  return Math.max(MIN_AMOUNT_FONT_SIZE, scaled);
}

export type AmountSymbol =
  | { readonly kind: "none" }
  | { readonly kind: "glyph"; readonly name: CurrencyGlyphKey }
  | { readonly kind: "text"; readonly label: string };

/** How the amount's currency is drawn: an SVG glyph (SAR, AED), a text symbol, or nothing without an account. */
export function amountSymbol(currency: string | null): AmountSymbol {
  if (!currency) return { kind: "none" };
  const glyph = currencyGlyph(currency);
  if (glyph) return { kind: "glyph", name: glyph };
  const symbol = currencySymbol(currency);
  // ISO-code fallbacks ("CHF") need breathing room before the digits.
  return { kind: "text", label: /^[A-Z]{2,}$/.test(symbol) ? `${symbol} ` : symbol };
}

/** Characters the symbol occupies when sizing the amount line. */
export function amountSymbolLength(symbol: AmountSymbol): number {
  if (symbol.kind === "text") return symbol.label.length;
  return symbol.kind === "glyph" ? 1 : 0;
}
