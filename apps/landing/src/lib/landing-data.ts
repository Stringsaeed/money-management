/**
 * Copy and figures for the landing page, ported from the canvas board
 * "Landing" (Trove Design System). Colors are CSS custom properties from the Trove tokens.
 * Money is kept as numbers and formatted per visitor currency at render time.
 */

import { type Currency, formatAmount, withCode } from "./currency";
import type { RegionTerms } from "./region";

export const headline = { a: "One number", b: "until payday." } as const;

/** A receipt line ends in a status word or an amount printed with the currency's decimals. */
export type ReceiptLine = {
  emoji: string;
  label: string;
  color: string;
} & ({ status: string } | { amount: number });

const POSITIVE = "var(--light-positive-text)";

/** Third line: remittance in the Gulf, a yearly bill elsewhere. */
const monthlyLumpLine = (region: RegionTerms): ReceiptLine =>
  region.monthlyLump.kind === "send-home"
    ? { emoji: "💸", label: "SEND HOME", status: "PAID", color: POSITIVE }
    : {
        emoji: "🚘",
        label: region.monthlyLump.name.toUpperCase(),
        status: "SET ASIDE",
        color: POSITIVE,
      };

export const heroReceipt = (region: RegionTerms): ReceiptLine[] => [
  { emoji: "🏠", label: region.rent.one.toUpperCase(), status: "SET ASIDE", color: POSITIVE },
  { emoji: "💡", label: region.utility, status: "PAID", color: POSITIVE },
  monthlyLumpLine(region),
  { emoji: "🚗", label: "CAR LOAN", status: "TODAY", color: "var(--light-warning-text)" },
  { emoji: "🎒", label: "SCHOOL TERM", status: "ON TRACK", color: "var(--light-positive-text)" },
  { emoji: "🛒", label: "GROCERIES", amount: 588, color: "var(--light-text-on-paper)" },
  { emoji: "🍽️", label: "DINING", amount: 148, color: "var(--light-text-on-paper)" },
];

export function tickerWords(currency: Currency, region: RegionTerms): string[] {
  const lump = monthlyLumpLine(region);
  return [
    `SAFE TO SPEND · ${withCode(1988, currency)}`,
    "≈ 142 A DAY",
    "14 DAYS TO PAYDAY",
    `${region.rent.one.toUpperCase()} SET ASIDE`,
    `${region.utility} PAID`,
    "status" in lump ? `${lump.label} ${lump.status}` : lump.label,
    "100% FREE · OPEN SOURCE",
    `EVERY ${currency.unit.toUpperCase()} HAS A JOB`,
  ];
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const lumps = (region: RegionTerms) => [
  {
    emoji: "🏠",
    title: capitalize(region.rent.the),
    when: "EVERY 3 MONTHS",
    amount: "15,000",
    accent: false,
  },
  { emoji: "🎒", title: "The school term", when: "JANUARY", amount: "9,000", accent: false },
  {
    emoji: region.season.emoji,
    title: region.season.name,
    when: region.season.month,
    amount: "3,000",
    accent: false,
  },
  region.monthlyLump.kind === "send-home"
    ? {
        emoji: "💸",
        title: "What you send home",
        when: "EVERY MONTH",
        amount: "2,000",
        accent: false,
      }
    : {
        emoji: "🚘",
        title: region.monthlyLump.name,
        when: "ONCE A YEAR",
        amount: "2,000",
        accent: false,
      },
  {
    emoji: "💼",
    title: "Salary vs bills",
    when: "LANDS 25TH · DUE 1ST",
    amount: "6 DAYS",
    accent: true,
  },
];

export const paydays = [
  { label: "1st", selected: false },
  { label: "25th", selected: true },
  { label: "28th", selected: false },
  { label: "Last workday", selected: false },
] as const;

export const jobs = [
  { emoji: "🧾", label: "BILLS", value: "4,675", strong: false },
  { emoji: "🛒", label: "EVERYDAY", value: "3,100", strong: false },
  { emoji: "🏠", label: "SAVING FOR", value: "5,695", strong: false },
  { emoji: "🫙", label: "NOT PLANNED", value: "730", strong: true },
] as const;

export interface RunwayTick {
  height: number;
  color: string;
}

/** Day 17 of 30: past days under/over the daily amount, today, then the days left. */
export function runwayTicks(): RunwayTick[] {
  const over = new Set([3, 7, 8, 13]);
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    if (day === 17) return { height: 16, color: "var(--light-text-primary)" };
    if (day > 17) return { height: 4, color: "rgba(21, 21, 21, 0.25)" };
    return over.has(day)
      ? { height: 12, color: "var(--light-negative-text)" }
      : { height: 7, color: "var(--light-positive-text)" };
  });
}

export const quickTaps = [
  { n: "1", title: "Amount", detail: "The keypad is already open." },
  { n: "2", title: "Envelope", detail: "Your most-used ones come first." },
  { n: "3", title: "Save", detail: "Account, date and note fill themselves." },
] as const;

export const savingGoals = (region: RegionTerms) => [
  { emoji: "🏠", name: region.rent.one, note: "10,000 / 15,000", pct: 67, warn: false },
  { emoji: "🎒", name: "School fees · term 2", note: "3,600 / 9,000", pct: 40, warn: false },
  { emoji: "🛟", name: "Emergency cushion", note: "4,200 / 10,000", pct: 42, warn: false },
  { emoji: region.season.emoji, name: region.season.name, note: "PLAN IT ›", pct: 0, warn: true },
];

export const rentCalculation = (currency: Currency, region: RegionTerms) => [
  { label: region.rent.line, value: formatAmount(15000, currency, true) },
  { label: "ALREADY SET ASIDE", value: formatAmount(-10000, currency, true) },
  { label: "STILL NEEDED", value: formatAmount(5000, currency, true) },
  { label: "PAYDAYS LEFT · 25 OCT, 25 NOV", value: "÷ 2" },
];

export const ritual = (currency: Currency) => [
  {
    emoji: "💰",
    n: "01",
    title: "Got paid",
    detail: "Log the salary. Only money that has landed gets planned.",
    stamp: "NEW MONTH",
    tone: "lime",
  },
  {
    emoji: "🧾",
    n: "02",
    title: "Wrap-up",
    detail: "See how the month went and check your balances still match.",
    stamp: "ON PLAN · 10/11",
    tone: "ink",
  },
  {
    emoji: "📦",
    n: "03",
    title: "Leftovers",
    detail: "Roll them over, save them, or give them a new job.",
    stamp: `${withCode(160, currency)} KEPT`,
    tone: "ink",
  },
  {
    emoji: "🔁",
    n: "04",
    title: "Repeat the plan",
    detail: "Last month's plan, with big payments worked out again.",
    stamp: "DONE IN 2 MIN",
    tone: "paper",
  },
];

export const ledgers = [
  {
    emoji: "👤",
    name: "Personal",
    sub: "Just you · your own accounts",
    safe: "1,988",
    shared: false,
  },
  {
    emoji: "🏠",
    name: "Household",
    sub: "With Sara · the joint account",
    safe: "2,410",
    shared: true,
  },
] as const;

export const nevers = [
  {
    title: "Charge you to use it",
    detail: "Trove is 100% free and open source. Every line of it is public on GitHub.",
  },
  {
    title: "Plan money you haven't been paid",
    detail: "Salary only counts once you tap Got paid. Expected income is never spent early.",
  },
  {
    title: "Pay a bill behind your back",
    detail: "Bills remind you. Nothing is recorded until you mark it paid.",
  },
  {
    title: "Shame you for a bad week",
    detail: "Over budget? You get one button, Cover it, and the month moves on.",
  },
] as const;
