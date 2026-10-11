/**
 * Display currency for the landing page, chosen per visitor from their country.
 * The list mirrors the account currency picker in mobile-next
 * (`src/features/ledger/accounts/account-display.ts`). Figures on the page keep the same
 * numbers in every currency; only the sign, ISO code and decimals change.
 */

export const CURRENCY_CODES = [
  "AED",
  "SAR",
  "EGP",
  "USD",
  "EUR",
  "GBP",
  "KWD",
  "QAR",
  "JPY",
  "CNY",
  "INR",
  "CAD",
  "AUD",
  "CHF",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** The page Trove designs against, and the one served when the country is unknown at build time. */
export const DEFAULT_CURRENCY: CurrencyCode = "AED";
/** Visitors from a country without its own entry below. */
export const FALLBACK_CURRENCY: CurrencyCode = "USD";

/** Signs drawn as SVG because fonts lack them (the new dirham and riyal signs). */
export type DrawnSign = "dirham" | "riyal";

export interface Currency {
  readonly code: CurrencyCode;
  /** Singular noun for copy: "Give every dirham a job". */
  readonly unit: string;
  readonly digits: number;
  /** A drawn sign, or the narrow text symbol (`$`, `E£`, `CHF`). */
  readonly sign: { readonly drawn: DrawnSign } | { readonly text: string };
}

const UNITS = {
  AED: "dirham",
  SAR: "riyal",
  EGP: "pound",
  USD: "dollar",
  EUR: "euro",
  GBP: "pound",
  KWD: "dinar",
  QAR: "riyal",
  JPY: "yen",
  CNY: "yuan",
  INR: "rupee",
  CAD: "dollar",
  AUD: "dollar",
  CHF: "franc",
} as const satisfies Record<CurrencyCode, string>;

const drawnSign = (code: CurrencyCode): DrawnSign | undefined => {
  if (code === "AED") return "dirham";
  if (code === "SAR") return "riyal";
  return undefined;
};

const narrowSymbol = (code: CurrencyCode) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? code;

/** Decimals the way the app derives them: from Intl, not a hand-kept table. */
const fractionDigits = (code: CurrencyCode) =>
  new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions()
    .maximumFractionDigits ?? 2;

export function currencyFor(code: CurrencyCode): Currency {
  const drawn = drawnSign(code);
  return {
    code,
    unit: UNITS[code],
    digits: fractionDigits(code),
    sign: drawn ? { drawn } : { text: narrowSymbol(code) },
  };
}

export const isCurrencyCode = (value: string): value is CurrencyCode =>
  CURRENCY_CODES.some((code) => code === value);

const EURO_AREA = [
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
  "AD",
  "MC",
  "SM",
  "VA",
  "ME",
  "XK",
] as const;

/** ISO 3166-1 alpha-2 country → display currency. */
const BY_COUNTRY = new Map<string, CurrencyCode>([
  ["AE", "AED"],
  ["SA", "SAR"],
  ["EG", "EGP"],
  ["US", "USD"],
  ["GB", "GBP"],
  ["KW", "KWD"],
  ["QA", "QAR"],
  ["JP", "JPY"],
  ["CN", "CNY"],
  ["IN", "INR"],
  ["CA", "CAD"],
  ["AU", "AUD"],
  ["CH", "CHF"],
  ["LI", "CHF"],
  ...EURO_AREA.map((country) => [country, "EUR"] as const),
]);

/**
 * Currency for a request: an explicit `?currency=` wins (QA and shared links), then the
 * visitor's ISO 3166 country, then the international fallback.
 */
export function pickCurrency(override: string | null, country: string | null): CurrencyCode {
  const requested = override?.toUpperCase();
  if (requested && isCurrencyCode(requested)) return requested;
  if (!country) return DEFAULT_CURRENCY;
  return BY_COUNTRY.get(country.toUpperCase()) ?? FALLBACK_CURRENCY;
}

const MINUS = "−";

/** `1988` → `1,988`; with `decimals`, padded to the currency's minor digits (`1,988.00`, `1,988`). */
export function formatAmount(value: number, currency: Currency, decimals = false): string {
  const digits = decimals ? currency.digits : 0;
  const text = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value));
  return value < 0 ? `${MINUS}${text}` : text;
}

/** Receipt style, ISO code first: `AED 1,988`, `−AED 64.20`. */
export function withCode(value: number, currency: Currency, decimals = false): string {
  const text = `${currency.code} ${formatAmount(Math.abs(value), currency, decimals)}`;
  return value < 0 ? `${MINUS}${text}` : text;
}

const LINEUP: readonly CurrencyCode[] = ["AED", "SAR", "EUR", "GBP", "JPY"];

/** The visitor's currency first, then the canvas line-up (AED · SAR · € · £ · ¥) to five. */
export function currencyLineup(currency: Currency): Currency[] {
  const others = LINEUP.filter((code) => code !== currency.code).map(currencyFor);
  return [currency, ...others].slice(0, LINEUP.length);
}

/**
 * Sign height for a currency set inline at 1em: text signs keep Plex Mono's natural cap height
 * (0.698em); the drawn dirham and riyal match the canvas at 0.72em.
 */
export const signHeight = (currency: Currency) => ("text" in currency.sign ? "0.698em" : "0.72em");

/** Accessible name for a sign shown on its own: "UAE Dirham", "Saudi Riyal". */
export const currencyName = (code: CurrencyCode) =>
  new Intl.DisplayNames("en", { type: "currency" }).of(code) ?? code;
