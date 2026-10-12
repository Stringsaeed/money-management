import { differenceInCalendarDays, format, parseISO } from "date-fns";

import { amountParts, compactAmount, type StatusPillStatus } from "@/ui/trove";

import type { BillRow, SavingRow } from "./bills-model";

/** Unsigned figure with every decimal, as bill rows print it: `1,850.00`. */
export function plainFigure(minor: number, currency: string): string {
  const parts = amountParts(Math.abs(minor), currency, "never");
  return `${parts.whole}${parts.fraction}`;
}

/** A receipt total with its currency code: `AED 2,225`, `−AED 40`. */
export function codeAmount(minor: number, currency: string): string {
  return `${minor < 0 ? "−" : ""}${currency} ${compactAmount(minor, currency)}`;
}

/** Dates more than this far ahead print their year, so next year's never reads as this year's. */
const SHOW_YEAR_AFTER_DAYS = 300;

/** "18 OCT", or "18 OCT 2027" when it is far enough ahead to be confused with this year's. */
export function shortDate(date: string, today: string): string {
  const parsed = parseISO(date);
  const far = differenceInCalendarDays(parsed, parseISO(today)) > SHOW_YEAR_AFTER_DAYS;
  return format(parsed, far ? "d MMM yyyy" : "d MMM").toUpperCase();
}

/** "DUE TODAY", "DUE 18 OCT", or "OVERDUE · 3 OCT" for one still owed from before today. */
export function dueStamp(date: string, today: string): string {
  if (date === today) return "DUE TODAY";
  if (date < today) return `OVERDUE · ${shortDate(date, today)}`;
  return `DUE ${shortDate(date, today)}`;
}

export interface PillCopy {
  readonly status: StatusPillStatus;
  readonly label: string;
  /** Spoken instead of the label when the label leans on a symbol or a bare figure. */
  readonly spoken?: string;
}

/** A Bills row's mono caption: when it is due and what the envelope holds. */
export function billMeta(row: BillRow, today: string, currency: string): string {
  const { status, line, dueDate } = row;
  const due = dueDate ? dueStamp(dueDate, today) : null;
  const holds = compactAmount(Math.max(line.totals.leftMinor, 0), currency);
  switch (status.kind) {
    case "paid":
      return "PAID THIS MONTH";
    case "unplanned":
      return "NOT PLANNED THIS MONTH";
    case "short":
      return due ? `${due} · ENVELOPE HAS ${holds}` : `ENVELOPE HAS ${holds}`;
    case "ready":
      return due ? `${due} · BILLS` : `${holds} LEFT · BILLS`;
  }
}

/** Paid ✓, Ready, Short 75, or No plan. */
export function billPill(row: BillRow, currency: string): PillCopy {
  const { status } = row;
  switch (status.kind) {
    case "paid":
      return { status: "paid", label: "Paid ✓", spoken: "Paid" };
    case "ready":
      return { status: "ready", label: "Ready" };
    case "short":
      return {
        status: "short",
        label: `Short ${compactAmount(status.shortMinor, currency)}`,
        spoken: `Short by ${codeAmount(status.shortMinor, currency)}`,
      };
    case "unplanned":
      return { status: "paid", label: "No plan", spoken: "Not planned this month" };
  }
}

/** A big payment's caption: its due date and what to set aside each payday. */
export function savingMeta(row: SavingRow, today: string, currency: string): string {
  const { dueDate, savingPerPaydayMinor } = row.line.envelope;
  const when = dueDate ? dueStamp(dueDate, today) : "NO DATE";
  if (row.funded) return `${when} · FULLY SET ASIDE`;
  if (savingPerPaydayMinor !== undefined && savingPerPaydayMinor > 0) {
    return `${when} · ${compactAmount(savingPerPaydayMinor, currency)} EACH PAYDAY`;
  }
  return when;
}

/** "10,000 / 15,000" set aside of the target, or just what is set aside without one. */
export function savingAmount(row: SavingRow, currency: string): string {
  const setAside = compactAmount(row.setAsideMinor, currency);
  return row.targetMinor === null
    ? setAside
    : `${setAside} / ${compactAmount(row.targetMinor, currency)}`;
}

/** Set aside ✓, Short 700, Not planned, Growing (no date), or On track. */
export function savingPill(row: SavingRow, currency: string): PillCopy {
  if (row.funded) return { status: "paid", label: "Set aside ✓", spoken: "Fully set aside" };
  for (const warning of row.warnings) {
    if (warning.kind === "short_before_payday") {
      return {
        status: "short",
        label: `Short ${compactAmount(warning.shortMinor, currency)}`,
        spoken: `Short by ${codeAmount(warning.shortMinor, currency)} before payday`,
      };
    }
  }
  if (row.warnings.length > 0) return { status: "short", label: "Not planned" };
  if (row.line.envelope.dueDate === null) return { status: "track", label: "Growing" };
  return { status: "track", label: "On track" };
}

export interface AttentionCopy {
  readonly title: string;
  readonly sub: string;
}

const paydaysAway = (count: number) => `${count} ${count === 1 ? "payday" : "paydays"} away`;

/** The attention slot over the big payments: the first warning, said in a line. */
export function savingAttention(row: SavingRow, today: string, currency: string): AttentionCopy {
  const { name, dueDate, paydaysLeft } = row.line.envelope;
  const due = dueDate ? format(parseISO(dueDate), "d MMM") : null;
  for (const warning of row.warnings) {
    if (warning.kind === "short_before_payday") {
      const short = `Short ${codeAmount(warning.shortMinor, currency)}`;
      return { title: `${name} is due before payday`, sub: due ? `${short} · due ${due}` : short };
    }
  }
  if (dueDate === null)
    return { title: `${name} isn't planned`, sub: "Nothing goes in this payday" };
  const when = dueDate < today ? `Was due ${due}` : `Due ${due}`;
  return {
    title: `${name} isn't planned`,
    sub: paydaysLeft === undefined ? when : `${when} · ${paydaysAway(paydaysLeft)}`,
  };
}
