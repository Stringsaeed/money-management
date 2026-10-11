import { formatAmount } from "@/lib/currency";
import type { RegionTerms } from "@/lib/region";
import type { Currency } from "@/lib/currency";

export type HomeTick = "now" | "future" | "over" | "under";

export interface BarGroup {
  /** Pixel heights of the income and spending bars. */
  inH: number;
  outH: number;
}

export interface UpcomingItem {
  mon: string;
  day: string;
  emoji: string;
  title: string;
  meta: string;
  amt: string;
  /** The next bill gets the highlighted date band. */
  next: boolean;
  /** Short of funds: the meta line turns warning-colored. */
  warn: boolean;
}

const INCOME = [12000, 12000, 12500, 12000, 13200, 12000];
const SPEND = [8400, 9100, 7600, 10200, 8800, 4286];

const px = (v: number): number => Math.round((v / 14000) * 96);

export const BAR_GROUPS: readonly BarGroup[] = INCOME.map((income, i) => ({
  inH: px(income),
  outH: px(SPEND[i] ?? 0),
}));

const DAYS = 30;
const DAY = 17;
const OVER_DAYS = [3, 7, 8, 13];

export const HOME_TICKS: readonly HomeTick[] = Array.from(
  { length: DAYS },
  (_, index): HomeTick => {
    const i = index + 1;
    if (i === DAY) return "now";
    if (i > DAY) return "future";
    return OVER_DAYS.includes(i) ? "over" : "under";
  },
);

export const upcoming = (currency: Currency, region: RegionTerms): readonly UpcomingItem[] => [
  {
    mon: "OCT",
    day: "11",
    emoji: "🚗",
    title: "Car loan",
    meta: "TODAY · BILLS · READY",
    amt: formatAmount(-1850, currency, true),
    next: true,
    warn: false,
  },
  {
    mon: "OCT",
    day: "18",
    emoji: "📶",
    title: region.phone,
    meta: `IN 7 DAYS · SHORT ${formatAmount(75, currency)}`,
    amt: formatAmount(-375, currency, true),
    next: false,
    warn: true,
  },
];

/** A figure set as a whole part and a smaller minor-unit tail. */
export interface SplitAmount {
  whole: string;
  cents: string;
}

/** Net worth split into the whole part and the minor-unit tail (`.50`, `.500`, or none for JPY). */
export function netWorth(currency: Currency): SplitAmount {
  const cents = currency.digits > 0 ? `.${(0.5).toFixed(currency.digits).slice(2)}` : "";
  return { whole: formatAmount(49526, currency), cents };
}
