import { amountParts, currencyFractionDigits } from "../amount";

/** Integer digits kept before the decimal point; 9 digits is plenty for one transaction. */
const MAX_WHOLE_DIGITS = 9;

/**
 * Normalises raw typing into a plain decimal string: digits, at most one ".", no leading
 * zeros, and no more fraction digits than the currency has. "," counts as ".".
 */
export function sanitizeAmountInput(raw: string, fractionDigits: number): string {
  const cleaned = raw.replaceAll(",", ".").replace(/[^\d.]/g, "");
  const [wholeRaw = "", ...rest] = cleaned.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "").slice(0, MAX_WHOLE_DIGITS);
  if (fractionDigits === 0 || rest.length === 0) return whole;
  return `${whole || "0"}.${rest.join("").slice(0, fractionDigits)}`;
}

const groupWhole = (whole: string) => {
  if (whole === "") return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(whole));
};

/** What the big number shows: grouped integer digits, then whatever fraction was typed. */
export function formatAmountDisplay(value: string): string {
  const [whole = "", fraction] = value.split(".");
  return fraction === undefined ? groupWhole(whole) : `${groupWhole(whole)}.${fraction}`;
}

/** Quick-pick chip text in major units, e.g. `$250` or `AED 250`. */
export function quickPickLabel(amount: number, currency: string): string {
  const minor = amount * 10 ** currencyFractionDigits(currency);
  const parts = amountParts(minor, currency, "never");
  const prefix = parts.glyph ? currency : parts.symbol;
  // Glyph currencies and bare ISO codes need a space: `AED 250`, not `AED250`.
  const spaced = Boolean(parts.glyph) || /^[A-Za-z]{2,}$/.test(parts.symbol);
  return `${prefix}${spaced ? " " : ""}${parts.whole}`;
}

/** A chip is selected when the typed value equals its amount. */
export function isQuickPickSelected(value: string, amount: number): boolean {
  return value !== "" && Number(value) === amount;
}
