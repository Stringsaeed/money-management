/**
 * Decimal-string money formatting. Everything here is digit-string math — a price like
 * `0.00001842` never passes through a float, so no digit is lost or invented.
 */

/** Four significant digits is the Trove default for sub-1 prices. */
export const DEFAULT_SIGNIFICANT = 4;

interface ParsedDecimal {
  readonly negative: boolean;
  /** Integer digits with no leading zeros (`"0"` when the integer part is zero). */
  readonly whole: string;
  readonly fraction: string;
}

export interface FormattedDecimal {
  readonly negative: boolean;
  /** Every displayed digit is zero: no sign is printed, even with `signDisplay="always"`. */
  readonly zero: boolean;
  /** Integer digits, not yet grouped. */
  readonly whole: string;
  /** The currency's own minor-unit digits (`"18"` for 0.1834 in USD): set at full size. */
  readonly main: string;
  /** Digits past the minor unit that are still significant (`"34"`): set smaller and faded. */
  readonly tail: string;
}

const DECIMAL_PATTERN = /^([+-])?(\d*)(?:\.(\d*))?$/;
const ZERO_DIGITS = /^0*$/;
const FIVE_CODE = "5".charCodeAt(0);

/** Parses `"61240.18"`, `"-0.5"`, `".5"`, `"7."`. Anything else (exponents, commas) is `null`. */
export function parseDecimalString(value: string): ParsedDecimal | null {
  const match = DECIMAL_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, sign, rawWhole = "", fraction = ""] = match;
  if (rawWhole === "" && fraction === "") return null;
  return {
    negative: sign === "-",
    whole: rawWhole.replace(/^0+(?=\d)/, "") || "0",
    fraction,
  };
}

/** Adds one to a digit string, growing it on carry-out ("999" -> "1000"). */
function incrementDigits(digits: string): string {
  const out = digits.split("");
  for (let index = out.length - 1; index >= 0; index -= 1) {
    if (out[index] !== "9") {
      out[index] = String(Number(out[index]) + 1);
      return out.join("");
    }
    out[index] = "0";
  }
  return `1${out.join("")}`;
}

/** Rounds a digit string half-up to `keep` digits; may come back one digit longer on carry. */
function roundDigits(digits: string, keep: number): string {
  if (digits.length <= keep) return digits.padEnd(keep, "0");
  const head = digits.slice(0, keep);
  return digits.charCodeAt(keep) < FIVE_CODE ? head : incrementDigits(head);
}

interface Rounded {
  readonly whole: string;
  readonly fraction: string;
}

/** Rounds to a fixed number of decimal places. */
function roundToPlaces(whole: string, fraction: string, places: number): Rounded {
  const rounded = roundDigits(whole + fraction, whole.length + places);
  const wholeLength = rounded.length - places;
  return { whole: rounded.slice(0, wholeLength), fraction: rounded.slice(wholeLength) };
}

const finish = (negative: boolean, whole: string, main: string, tail: string): FormattedDecimal => {
  const zero = ZERO_DIGITS.test(whole) && ZERO_DIGITS.test(main) && ZERO_DIGITS.test(tail);
  return { negative: negative && !zero, zero, whole, main, tail };
};

/** 1 and above: the currency's minor-unit digits, nothing finer. */
function formatAtLeastOne(negative: boolean, whole: string, fraction: string, cent: number) {
  const rounded = roundToPlaces(whole, fraction, cent);
  return finish(negative, rounded.whole, rounded.fraction, "");
}

/** Below 1: keep `significant` digits from the first non-zero one, never fewer than the cents. */
function formatBelowOne(
  negative: boolean,
  fraction: string,
  cent: number,
  significant: number,
): FormattedDecimal {
  const leading = fraction.search(/[1-9]/);
  if (leading === -1) return finish(negative, "0", "0".repeat(cent), "");

  const rounded = roundToPlaces("0", fraction, Math.max(leading + significant, cent));
  // 0.99996 rounds up to 1 — from there on it follows the "1 and above" rule.
  if (rounded.whole !== "0") return formatAtLeastOne(negative, rounded.whole, "", cent);

  const main = rounded.fraction.slice(0, cent).padEnd(cent, "0");
  const tail = rounded.fraction.slice(cent).replace(/0+$/, "");
  return finish(negative, "0", main, tail);
}

/**
 * Splits a decimal string into the pieces Trove sets separately.
 * `cent` is the currency's fraction digits (2 for USD, 0 for JPY).
 *
 * - 1 and above: `cent` decimals — `61240.18` -> `61240` `18`.
 * - Below 1: `significant` digits from the first non-zero one — `0.00001842` ->
 *   main `00`, tail `001842`; `0.1834` -> main `18`, tail `34`.
 *
 * Returns `null` for input that is not a plain decimal string.
 */
export function formatDecimal(
  value: string,
  significant: number = DEFAULT_SIGNIFICANT,
  cent = 2,
): FormattedDecimal | null {
  const parsed = parseDecimalString(value);
  if (!parsed) return null;
  const digits = Math.max(1, Math.floor(significant));
  if (parsed.whole !== "0") {
    return formatAtLeastOne(parsed.negative, parsed.whole, parsed.fraction, cent);
  }
  return formatBelowOne(parsed.negative, parsed.fraction, cent, digits);
}

/** Like `formatDecimal`, but unparseable input reads as zero instead of `null`. */
export function formatDecimalOrZero(
  value: string,
  significant: number = DEFAULT_SIGNIFICANT,
  cent = 2,
): FormattedDecimal {
  return formatDecimal(value, significant, cent) ?? finish(false, "0", "0".repeat(cent), "");
}
