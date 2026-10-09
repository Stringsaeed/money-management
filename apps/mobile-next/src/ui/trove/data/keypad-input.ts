/** Digits and decimal point are kept in a canonical string ("12.5"); display swaps the separator. */
export type KeypadDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type KeypadKey = KeypadDigit | "decimal" | "backspace";

export interface KeypadLimits {
  /** 0 hides the decimal key (JPY and friends). */
  readonly maxFractionDigits: number;
  readonly maxIntegerDigits: number;
}

export const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["decimal", "0", "backspace"],
] as const satisfies readonly (readonly KeypadKey[])[];

const DECIMAL = ".";

const appendDigit = (value: string, digit: KeypadDigit, limits: KeypadLimits): string => {
  const [whole = "", fraction] = value.split(DECIMAL);
  if (fraction !== undefined) {
    return fraction.length < limits.maxFractionDigits ? `${value}${digit}` : value;
  }
  if (whole === "0") return digit;
  return whole.length < limits.maxIntegerDigits ? `${value}${digit}` : value;
};

const appendDecimal = (value: string, limits: KeypadLimits): string => {
  if (limits.maxFractionDigits === 0 || value.includes(DECIMAL)) return value;
  return value === "" ? `0${DECIMAL}` : `${value}${DECIMAL}`;
};

/** Pure entry reducer: returns the next canonical value for a key press, or the same value if rejected. */
export function applyKeypadKey(value: string, key: KeypadKey, limits: KeypadLimits): string {
  if (key === "backspace") return value.slice(0, -1);
  if (key === "decimal") return appendDecimal(value, limits);
  return appendDigit(value, key, limits);
}

/** Decimal separator of a locale (the device locale when omitted); falls back to ".". */
export function localeDecimalSeparator(locale?: string): string {
  try {
    const part = new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === "decimal");
    return part?.value ?? DECIMAL;
  } catch {
    return DECIMAL;
  }
}

/** Canonical value for display: swaps in the locale separator, and shows "0" for an empty entry. */
export function formatKeypadValue(value: string, separator: string): string {
  if (value === "") return "0";
  return value.replace(DECIMAL, separator);
}

/** Canonical value to integer minor units, without float math. "12.5" at 2 digits is 1250. */
export function keypadValueToMinor(value: string, fractionDigits: number): number {
  const [whole = "", fraction = ""] = value.split(DECIMAL);
  const padded = fraction.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  return Number(`${whole === "" ? "0" : whole}${padded}`);
}

const KEY_LABELS = {
  decimal: "Decimal point",
  backspace: "Delete",
} as const satisfies Record<"decimal" | "backspace", string>;

export function keypadKeyLabel(key: KeypadKey): string {
  if (key === "decimal" || key === "backspace") return KEY_LABELS[key];
  return key;
}
