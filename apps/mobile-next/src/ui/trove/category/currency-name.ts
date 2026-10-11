const NAMES = {
  AED: "UAE dirham",
  SAR: "Saudi riyal",
  EUR: "Euro",
  GBP: "British pound",
  JPY: "Japanese yen",
  CNY: "Chinese yuan",
  USD: "US dollar",
} as const satisfies Record<string, string>;

const isKnown = (code: string): code is keyof typeof NAMES => Object.hasOwn(NAMES, code);

/** Spoken name of a currency; the ISO code itself when no name is known. */
export function currencyName(code: string): string {
  const upper = code.toUpperCase();
  return isKnown(upper) ? NAMES[upper] : upper;
}
