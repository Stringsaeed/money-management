import { formatAmount, withCode } from "@/lib/currency";
import type { RegionTerms } from "@/lib/region";
import type { Currency } from "@/lib/currency";

export type RunwayTick = "now" | "future" | "over" | "under";

export interface EnvelopeRow {
  emoji: string;
  name: string;
  sub: string;
  left: string;
  of: string;
  /** Share of the plan already spent, 0–100. */
  pct: number;
  over: boolean;
}

export interface BudgetTicket {
  label: string;
  emoji: string;
  big: string;
  sub: string;
}

export interface BudgetHomeData {
  dateLine: string;
  dueCount: number;
  /** Needs-attention banner copy. */
  attentionTitle: string;
  attentionSub: string;
  safe: string;
  chip: string;
  daysLeft: number;
  /** Where "today" sits on the envelope bars, in percent. */
  pace: number;
  ticks: RunwayTick[];
  everydayLine: string;
  rows: EnvelopeRow[];
  tickets: BudgetTicket[];
}

/** The "today" state: day 17 of 30, a car loan due, nothing over budget. */
const DAYS = 30;
const DAY = 17;
const NOT_PLANNED = 730;
const OVER_DAYS = [3, 7, 8, 13];

/** [emoji, name, planned, spent]; the transport envelope takes the local name. */
const envelopes = (region: RegionTerms): readonly (readonly [string, string, number, number])[] => [
  ["🛒", "Groceries", 1600, 1012],
  ["🍽️", "Dining & coffee", 600, 452],
  ["⛽", region.fuel, 500, 260],
  ["🎈", "Personal & fun", 400, 118],
];

const CAR_LOAN = 1850;
const SET_ASIDE = 5695;

export function budgetHomeToday(currency: Currency, region: RegionTerms): BudgetHomeData {
  const fmt = (n: number) => formatAmount(n, currency);
  const daysLeft = DAYS - DAY + 1;
  const pace = Math.round(((DAY - 0.5) / DAYS) * 100);

  let everyday = 0;
  const rows = envelopes(region).map(([emoji, name, planned, spent]): EnvelopeRow => {
    const left = planned - spent;
    everyday += left;
    const over = left < 0;
    const pct = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;
    return {
      emoji,
      name,
      sub: over
        ? `Over by ${fmt(-left)}`
        : `${withCode(Math.floor(Math.max(left, 0) / daysLeft), currency)} a day`,
      left: fmt(left),
      of: `of ${fmt(planned)}`,
      pct: over ? 100 : pct,
      over,
    };
  });

  const safe = everyday + NOT_PLANNED;
  const perDay = Math.floor(Math.max(safe, 0) / daysLeft);

  const ticks: RunwayTick[] = [];
  for (let i = 1; i <= DAYS; i++) {
    if (i === DAY) ticks.push("now");
    else if (i > DAY) ticks.push("future");
    else ticks.push(OVER_DAYS.includes(i) ? "over" : "under");
  }

  return {
    dateLine: "SUN 11.10.26",
    dueCount: 2,
    attentionTitle: `Car loan · ${withCode(CAR_LOAN, currency)} due today`,
    attentionSub: `+1 more · ${withCode(NOT_PLANNED, currency)} not planned yet ›`,
    safe: fmt(safe),
    chip: safe <= 0 ? `${withCode(0, currency)} A DAY` : `≈ ${withCode(perDay, currency)} A DAY`,
    daysLeft,
    pace,
    ticks,
    everydayLine: `${withCode(everyday, currency)} LEFT`,
    rows,
    tickets: [
      { label: "BILLS", emoji: "🧾", big: "2 of 4 paid", sub: "next · Car loan today" },
      {
        label: "SAVING FOR",
        emoji: "🏠",
        big: `${fmt(SET_ASIDE)} set aside`,
        sub: `${region.rent.one} · 1 Dec`,
      },
    ],
  };
}
