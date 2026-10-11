/**
 * Everyday words that only make sense locally: the electricity company, the phone network, the
 * toll road, how rent is paid, the festive season, a grocery note. Each currency page carries the
 * profile for the country it serves, so a visitor in Riyadh never reads "DEWA" or "Salik".
 * Figures and layout stay identical across profiles; only these words change.
 */
import type { CurrencyCode } from "./currency";

export interface RegionTerms {
  /** Utility bill on receipts, as printed: "DEWA", "SEC", "ELECTRICITY". */
  readonly utility: string;
  /** Phone bill payee on Home's upcoming list: "du", "STC", "Phone bill". */
  readonly phone: string;
  /** Transport envelope: "Fuel & Salik", "Gas & tolls". */
  readonly fuel: string;
  /** The lump the "Saving for" story is about. */
  readonly rent: {
    /** "Rent cheque" (UAE post-dated cheques) or "Rent". */
    readonly one: string;
    /** Headline subject: "Rent cheques stop being a surprise." */
    readonly many: string;
    /** In running copy and the problem list: "the rent cheque", "the quarterly rent". */
    readonly the: string;
    /** Receipt line for the full amount: "CHEQUE", "RENT". */
    readonly line: string;
  };
  /** Seasonal lump: "Ramadan & Eid", "Holidays", "Diwali". */
  readonly season: { readonly name: string; readonly emoji: string; readonly month: string };
  /**
   * Remittance is a monthly fact of life for Gulf expats. Elsewhere the same slot shows a
   * yearly bill the monthly budget forgets.
   */
  readonly monthlyLump:
    | { readonly kind: "send-home" }
    | { readonly kind: "yearly-bill"; readonly name: string };
  /** A note the smart-categories demo turns into Groceries. */
  readonly groceryNote: string;
}

const RENT_CHEQUE = {
  one: "Rent cheque",
  many: "Rent cheques",
  the: "the rent cheque",
  line: "CHEQUE",
} as const;

const QUARTERLY_RENT = {
  one: "Rent",
  many: "Big rent payments",
  the: "the quarterly rent",
  line: "RENT",
} as const;

const RAMADAN = { name: "Ramadan & Eid", emoji: "🌙", month: "FEBRUARY" } as const;
const HOLIDAYS = { name: "The holidays", emoji: "🎁", month: "DECEMBER" } as const;
const SEND_HOME = { kind: "send-home" } as const;
const CAR_INSURANCE = { kind: "yearly-bill", name: "Car insurance" } as const;

const GULF = {
  fuel: "Fuel",
  rent: QUARTERLY_RENT,
  season: RAMADAN,
  monthlyLump: SEND_HOME,
} as const;

const INTERNATIONAL = {
  utility: "ELECTRICITY",
  phone: "Phone bill",
  fuel: "Fuel",
  rent: QUARTERLY_RENT,
  season: HOLIDAYS,
  monthlyLump: CAR_INSURANCE,
  groceryNote: "Corner shop",
} as const satisfies RegionTerms;

const PROFILES = {
  AED: {
    utility: "DEWA",
    phone: "du",
    fuel: "Fuel & Salik",
    rent: RENT_CHEQUE,
    season: RAMADAN,
    monthlyLump: SEND_HOME,
    groceryNote: "Carrefour",
  },
  SAR: { ...GULF, utility: "SEC", phone: "STC", groceryNote: "Panda" },
  KWD: { ...GULF, utility: "MEW", phone: "Zain", groceryNote: "Sultan Center" },
  QAR: { ...GULF, utility: "KAHRAMAA", phone: "Ooredoo", groceryNote: "Al Meera" },
  EGP: {
    ...INTERNATIONAL,
    phone: "Vodafone",
    season: RAMADAN,
    groceryNote: "Breadfast",
  },
  USD: { ...INTERNATIONAL, fuel: "Gas & tolls", groceryNote: "Trader Joe's" },
  CAD: { ...INTERNATIONAL, fuel: "Gas & parking", groceryNote: "Loblaws" },
  GBP: { ...INTERNATIONAL, utility: "ENERGY", fuel: "Petrol", groceryNote: "Tesco" },
  EUR: { ...INTERNATIONAL, groceryNote: "Lidl" },
  CHF: { ...INTERNATIONAL, groceryNote: "Migros" },
  AUD: { ...INTERNATIONAL, fuel: "Petrol & tolls", groceryNote: "Woolworths" },
  INR: {
    ...INTERNATIONAL,
    phone: "Jio",
    season: { name: "Diwali", emoji: "🪔", month: "OCTOBER" },
    groceryNote: "BigBasket",
  },
  JPY: { ...INTERNATIONAL, groceryNote: "Konbini" },
  CNY: { ...INTERNATIONAL, groceryNote: "Hema" },
} as const satisfies Record<CurrencyCode, RegionTerms>;

export function regionFor(code: CurrencyCode): RegionTerms {
  return PROFILES[code];
}
