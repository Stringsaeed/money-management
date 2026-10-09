import { addDays, format, startOfToday, subDays } from "date-fns";

import type {
  BalanceChartDatum,
  CategoryAmount,
  CategoryKey,
  ColumnChartDatum,
  IconName,
  TypeVariant,
} from "@/ui/trove";

/** All fixtures are pure data in integer minor units. */

export const GALLERY_CURRENCY = "USD";

export const CURRENCIES = ["USD", "AED", "SAR", "EUR", "JPY"] as const;

export const TYPE_SAMPLES = [
  { variant: "display", sample: "Good morning" },
  { variant: "titleLg", sample: "Move money" },
  { variant: "titleMd", sample: "Where it went" },
  { variant: "titleSm", sample: "Daily spending" },
  { variant: "bodyLg", sample: "Fresh Market charged your card." },
  { variant: "bodyMd", sample: "Groceries · 8:12 AM" },
  { variant: "bodySm", sample: "Last updated 2 minutes ago" },
  { variant: "labelLg", sample: "Continue" },
  { variant: "labelMd", sample: "Fresh Market" },
  { variant: "labelSm", sample: "Spending" },
  { variant: "amountHero", sample: "$12,845.03" },
  { variant: "amountLg", sample: "−$1,842.30" },
  { variant: "amountMd", sample: "−$64.20" },
  { variant: "amountSm", sample: "+$4,200.00" },
  { variant: "stamp", sample: "TOTAL BALANCE" },
  { variant: "receipt", sample: "AED 64.20 · 08 OCT" },
] as const satisfies readonly { variant: TypeVariant; sample: string }[];

export const NAV_ICON_NAMES = [
  "home",
  "ledger",
  "insights",
  "settings",
  "accounts",
] as const satisfies readonly IconName[];

export const UI_ICON_NAMES = [
  "add",
  "search",
  "filter",
  "close",
  "check",
  "chevron-right",
  "chevron-left",
  "chevron-down",
  "more",
  "calendar",
  "note",
  "recurring",
  "category",
  "transfer",
  "expense",
  "income",
  "bank",
  "receipt",
  "bell",
  "eye",
  "eye-off",
  "lock",
  "trash",
  "info",
  "warning",
  "backspace",
] as const satisfies readonly IconName[];

export const CATEGORY_ICON_NAMES = [
  "groceries",
  "dining",
  "coffee",
  "fast-food",
  "car",
  "fuel",
  "transit",
  "travel",
  "housing",
  "utilities",
  "phone",
  "internet",
  "shopping",
  "clothing",
  "pharmacy",
  "health",
  "fitness",
  "movies",
  "gaming",
  "music",
  "books",
  "education",
  "pets",
  "kids",
  "gifts",
  "beauty",
  "repairs",
  "bills",
  "card",
  "salary",
  "savings",
  "investments",
  "leisure",
  "transport",
  "other",
] as const satisfies readonly IconName[];

export const CATEGORY_TILES = [
  { key: "groceries", label: "Groceries" },
  { key: "dining", label: "Dining" },
  { key: "transport", label: "Transport" },
  { key: "bills", label: "Bills" },
  { key: "shopping", label: "Shopping" },
  { key: "leisure", label: "Leisure" },
  { key: "other", label: "Other" },
] as const satisfies readonly { key: CategoryKey; label: string }[];

export const SEGMENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "spending", label: "Spending" },
  { value: "income", label: "Income" },
] as const;

export const FILTER_CHIPS = ["All", "Groceries", "Dining", "Transport"] as const;

export const QUICK_PICKS = [50, 100, 250] as const;

export const TREND = [92000, 118000, 101000, 134000, 126000, 151000, 184230] as const;

/** Spending per day, cycling through a fixed pattern so the chart has visible variety. */
const DAILY_PATTERN = [
  4200, 0, 8600, 2300, 15400, 6400, 3100, 0, 9800, 5200, 2700, 12100, 4500, 7300,
] as const;

const BALANCE_START_MINOR = 1_180_000;

const isoDay = (date: Date) => format(date, "yyyy-MM-dd");

export function dailySpending(days = 14): ColumnChartDatum[] {
  const today = startOfToday();
  return Array.from({ length: days }, (_, index) => ({
    date: isoDay(subDays(today, days - 1 - index)),
    minor: DAILY_PATTERN[index % DAILY_PATTERN.length] ?? 0,
  }));
}

export function balanceSeries(days = 30): BalanceChartDatum[] {
  const start = subDays(startOfToday(), days - 1);
  let balance = BALANCE_START_MINOR;
  return Array.from({ length: days }, (_, index) => {
    const wiggle = ((index * 7) % 11) - 5;
    const payday = index === 12 ? 420_000 : 0;
    balance += payday - 9_000 - wiggle * 4_000;
    return { date: isoDay(addDays(start, index)), minor: balance };
  });
}

export const EIGHT_CATEGORIES = [
  { id: "groceries", name: "Groceries", minor: 48200, colorKey: "groceries" },
  { id: "dining", name: "Dining out", minor: 37100, colorKey: "dining" },
  { id: "transport", name: "Transport", minor: 21400, colorKey: "transport" },
  { id: "bills", name: "Bills", minor: 19800, colorKey: "bills" },
  { id: "shopping", name: "Shopping", minor: 15600 },
  { id: "leisure", name: "Leisure", minor: 11200 },
  { id: "pets", name: "Pets", minor: 6400 },
  { id: "gifts", name: "Gifts", minor: 4100 },
] as const satisfies readonly CategoryAmount[];
