import { amountAccessibilityLabel, currencyFractionDigits } from "../amount/amount-parts";

export type EntrySize = 60 | 44 | 34;

/** Hero size while the amount is short, stepping down as digits are added so it never wraps. */
export function entrySize(characterCount: number): EntrySize {
  if (characterCount <= 7) return 60;
  if (characterCount <= 9) return 44;
  return 34;
}

export type EntryCharKind = "digit" | "group" | "point" | "ghost";

export interface EntryChar {
  /** Stable across appends so only a newly typed digit mounts (and fades in). */
  key: string;
  char: string;
  kind: EntryCharKind;
}

export interface EntryLayout {
  chars: readonly EntryChar[];
  /** Nothing typed yet: the whole figure is faded. */
  empty: boolean;
  size: EntrySize;
}

/** Thousands separator of a locale (the device locale when omitted); "," when it has none. */
export function localeGroupSeparator(locale?: string): string {
  try {
    const sample = new Intl.NumberFormat(locale, { useGrouping: true }).format(1000000);
    return sample.replace(/\d/g, "").charAt(0) || ",";
  } catch {
    return ",";
  }
}

const groupWhole = (whole: string, separator: string): string[] => {
  const out: string[] = [];
  for (let index = 0; index < whole.length; index++) {
    const remaining = whole.length - index;
    if (separator !== "" && index > 0 && remaining % 3 === 0) out.push(separator);
    out.push(whole.charAt(index));
  }
  return out;
};

const POINT = ".";

interface LayoutOptions {
  /** Decimals the currency has (0 for JPY). */
  fractionDigits: number;
  decimalSeparator: string;
  groupSeparator: string;
}

/**
 * Splits the plain entry string ("64.2") into the characters drawn: typed digits, grouping marks,
 * the decimal point once typed, and faded ghost characters for the cents not typed yet ("0", then ".00").
 */
export function entryLayout(value: string, options: LayoutOptions): EntryLayout {
  const { decimalSeparator, groupSeparator } = options;
  const [whole = "", fraction] = value.split(POINT);
  const typedWhole = whole === "" ? "0" : whole;
  const chars: EntryChar[] = [];
  let digitIndex = 0;
  for (const char of groupWhole(typedWhole, groupSeparator)) {
    if (groupSeparator !== "" && char === groupSeparator) {
      chars.push({ key: `g${digitIndex}`, char, kind: "group" });
    } else {
      chars.push({ key: `d${digitIndex}-${char}`, char, kind: "digit" });
      digitIndex += 1;
    }
  }
  if (fraction !== undefined) chars.push({ key: "point", char: decimalSeparator, kind: "point" });
  const typedFraction = fraction ?? "";
  for (const char of typedFraction) {
    chars.push({ key: `d${digitIndex}-${char}`, char, kind: "digit" });
    digitIndex += 1;
  }
  chars.push(...ghostChars(fraction, typedFraction.length, options));
  return { chars, empty: value === "", size: entrySize(chars.length) };
}

function ghostChars(
  fraction: string | undefined,
  typedFractionLength: number,
  { fractionDigits, decimalSeparator }: LayoutOptions,
): EntryChar[] {
  const missing = Math.max(0, fractionDigits - typedFractionLength);
  const ghosts: EntryChar[] = [];
  if (fraction === undefined && fractionDigits > 0) {
    ghosts.push({ key: "ghost-point", char: decimalSeparator, kind: "ghost" });
  }
  for (let index = 0; index < missing; index++) {
    ghosts.push({ key: `ghost-${typedFractionLength + index}`, char: "0", kind: "ghost" });
  }
  return ghosts;
}

/** Plain entry to integer minor units, without float math: "64.2" at 2 digits is 6420. */
export function entryToMinor(value: string, fractionDigits: number): number {
  const [whole = "", fraction = ""] = value.split(POINT);
  const padded = fraction.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  return Number(`${whole === "" ? "0" : whole}${padded}`);
}

/** Spoken form of the entry: "minus 64.20 AED". */
export function entryAccessibilityLabel(
  value: string,
  currency: string,
  negative: boolean,
): string {
  const minor = entryToMinor(value, currencyFractionDigits(currency));
  const label = amountAccessibilityLabel(minor, currency);
  return negative && minor !== 0 ? `minus ${label}` : label;
}
