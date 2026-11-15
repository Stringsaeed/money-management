import {
  type V2DueOccurrence,
  type V2Envelope,
  type V2EnvelopeTotals,
} from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../home/home-model";

export type BillStatus =
  | { readonly kind: "paid" }
  | { readonly kind: "ready" }
  | { readonly kind: "short"; readonly shortMinor: number }
  | { readonly kind: "unplanned" };

/**
 * Where a Bills envelope stands this period. `dueMinor` is what its bills on the Due list still
 * need this period (`dueByEnvelope`); without it, the plan that has not been spent yet. Short
 * means Left cannot cover it.
 */
export function billStatus(
  totals: Pick<V2EnvelopeTotals, "plannedMinor" | "spentMinor" | "leftMinor">,
  dueMinor?: number,
): BillStatus {
  const { plannedMinor, spentMinor, leftMinor } = totals;
  const expectedMinor = dueMinor ?? Math.max(plannedMinor - spentMinor, 0);
  if (leftMinor < expectedMinor) return { kind: "short", shortMinor: expectedMinor - leftMinor };
  if (dueMinor === undefined && plannedMinor > 0 && spentMinor >= plannedMinor) {
    return { kind: "paid" };
  }
  if (plannedMinor === 0 && spentMinor === 0 && leftMinor === 0) return { kind: "unplanned" };
  return { kind: "ready" };
}

/** An expense bill in the budget's currency with a Category, due by `periodEnd`. */
const owedBill = (
  item: V2DueOccurrence,
  currency: string,
  periodEnd: string,
): item is V2DueOccurrence & { categoryId: string } =>
  item.kind === "expense" &&
  item.currency === currency &&
  item.categoryId !== null &&
  item.scheduledDate <= periodEnd;

/**
 * What each Bills envelope still has to pay before the period ends, from the Due list: expense
 * bills in the budget's currency in a Category the envelope holds, due on or before `periodEnd`. Overdue ones from earlier
 * periods count because they are still owed, and snoozed ones count because a snooze only delays
 * the reminder. Envelopes with no such bill get no entry.
 */
export function dueByEnvelope(
  items: readonly V2DueOccurrence[],
  envelopes: readonly Pick<V2Envelope, "id" | "group" | "categoryIds">[],
  currency: string,
  periodEnd: string,
): Map<string, number> {
  const envelopeByCategory = new Map(
    envelopes
      .filter((envelope) => envelope.group === "bills")
      .flatMap((envelope) =>
        envelope.categoryIds.map((categoryId): [string, string] => [categoryId, envelope.id]),
      ),
  );
  const due = new Map<string, number>();
  for (const item of items) {
    const envelopeId = owedBill(item, currency, periodEnd)
      ? envelopeByCategory.get(item.categoryId)
      : null;
    if (!envelopeId) continue;
    due.set(envelopeId, (due.get(envelopeId) ?? 0) + item.amountMinor);
  }
  return due;
}

/**
 * The earliest bill each Bills envelope still has to pay by `periodEnd`, from the same Due list
 * items `dueByEnvelope` counts. Envelopes with no such bill get no entry.
 */
export function firstDueByEnvelope(
  items: readonly V2DueOccurrence[],
  envelopes: readonly Pick<V2Envelope, "id" | "group" | "categoryIds">[],
  currency: string,
  periodEnd: string,
): Map<string, string> {
  const envelopeByCategory = new Map(
    envelopes
      .filter((envelope) => envelope.group === "bills")
      .flatMap((envelope) =>
        envelope.categoryIds.map((categoryId): [string, string] => [categoryId, envelope.id]),
      ),
  );
  const first = new Map<string, string>();
  for (const item of items) {
    const envelopeId = owedBill(item, currency, periodEnd)
      ? envelopeByCategory.get(item.categoryId)
      : null;
    if (!envelopeId) continue;
    const current = first.get(envelopeId);
    if (current === undefined || item.scheduledDate < current) {
      first.set(envelopeId, item.scheduledDate);
    }
  }
  return first;
}

export interface BillRow {
  readonly line: EnvelopeLine;
  readonly status: BillStatus;
  /** What the bill costs this period: what was paid once paid, else what is still to pay. */
  readonly amountMinor: number;
  /** The earliest bill still owed this period, when the Due list knows one. */
  readonly dueDate: string | null;
}

/** Every Bills envelope with its status, this period's amount and its next due date. */
export function billRows(
  lines: readonly EnvelopeLine[],
  dueMinorByEnvelopeId?: ReadonlyMap<string, number>,
  firstDueByEnvelopeId?: ReadonlyMap<string, string>,
): BillRow[] {
  return billLines(lines).map((line) => {
    const dueMinor = dueMinorByEnvelopeId?.get(line.envelope.id);
    const status = billStatus(line.totals, dueMinor);
    const { plannedMinor, spentMinor } = line.totals;
    const amountMinor =
      status.kind === "paid"
        ? spentMinor
        : status.kind === "unplanned"
          ? 0
          : (dueMinor ?? Math.max(plannedMinor - spentMinor, 0));
    return {
      line,
      status,
      amountMinor,
      dueDate: firstDueByEnvelopeId?.get(line.envelope.id) ?? null,
    };
  });
}

export interface BillsMonthSummary {
  readonly count: number;
  readonly paidCount: number;
  readonly totalMinor: number;
  readonly paidMinor: number;
  readonly stillToPayMinor: number;
}

/** The B1 "This month" receipt: what the bills cost, what is paid, and what is still to pay. */
export function billsMonthSummary(rows: readonly BillRow[]): BillsMonthSummary {
  return rows.reduce<BillsMonthSummary>(
    (sum, row) => {
      const paid = row.status.kind === "paid";
      return {
        count: sum.count + 1,
        paidCount: sum.paidCount + (paid ? 1 : 0),
        totalMinor: sum.totalMinor + row.amountMinor,
        paidMinor: sum.paidMinor + (paid ? row.amountMinor : 0),
        stillToPayMinor: sum.stillToPayMinor + (paid ? 0 : row.amountMinor),
      };
    },
    { count: 0, paidCount: 0, totalMinor: 0, paidMinor: 0, stillToPayMinor: 0 },
  );
}

export type SavingWarning =
  | { readonly kind: "short_before_payday"; readonly shortMinor: number }
  | { readonly kind: "not_planned" };

export interface SavingRow {
  readonly line: EnvelopeLine;
  /** The envelope's Left, never below zero: money really put aside for it. */
  readonly setAsideMinor: number;
  readonly targetMinor: number | null;
  /** Share of the target set aside, 0 to 1. */
  readonly fraction: number;
  readonly funded: boolean;
  readonly warnings: readonly SavingWarning[];
}

export function savingRow(line: EnvelopeLine): SavingRow {
  const { envelope, totals } = line;
  const setAsideMinor = Math.max(totals.leftMinor, 0);
  const targetMinor = envelope.targetMinor;
  const funded = targetMinor !== null && setAsideMinor >= targetMinor;
  const warnings: SavingWarning[] = [];
  if (envelope.shortBeforePaydayMinor !== undefined) {
    warnings.push({ kind: "short_before_payday", shortMinor: envelope.shortBeforePaydayMinor });
  }
  if (targetMinor !== null && !funded && totals.plannedMinor === 0) {
    warnings.push({ kind: "not_planned" });
  }
  return {
    line,
    setAsideMinor,
    targetMinor,
    fraction: targetMinor === null ? 0 : Math.min(setAsideMinor / targetMinor, 1),
    funded,
    warnings,
  };
}

/** Saving-for envelopes, soonest due first; the ones with no due date go last. */
export function savingRows(lines: readonly EnvelopeLine[]): SavingRow[] {
  return lines
    .filter((line) => line.envelope.group === "saving")
    .map(savingRow)
    .sort((a, b) => {
      const dueA = a.line.envelope.dueDate;
      const dueB = b.line.envelope.dueDate;
      if (dueA === dueB) return 0;
      if (dueA === null) return 1;
      if (dueB === null) return -1;
      return dueA.localeCompare(dueB);
    });
}

export function billLines(lines: readonly EnvelopeLine[]): EnvelopeLine[] {
  return lines.filter((line) => line.envelope.group === "bills");
}

export interface SavingsSummary {
  readonly setAsideMinor: number;
  /** What the targets still need, across every big payment that has one. */
  readonly stillToSetAsideMinor: number;
  /** The server's per-payday suggestions added up. */
  readonly perPaydayMinor: number;
}

/** The B1 "Next 12 months" receipt. */
export function savingsSummary(rows: readonly SavingRow[]): SavingsSummary {
  return rows.reduce<SavingsSummary>(
    (sum, row) => ({
      setAsideMinor: sum.setAsideMinor + row.setAsideMinor,
      stillToSetAsideMinor:
        sum.stillToSetAsideMinor +
        (row.targetMinor === null ? 0 : Math.max(row.targetMinor - row.setAsideMinor, 0)),
      perPaydayMinor: sum.perPaydayMinor + (row.line.envelope.savingPerPaydayMinor ?? 0),
    }),
    { setAsideMinor: 0, stillToSetAsideMinor: 0, perPaydayMinor: 0 },
  );
}

/** The soonest big payment that needs attention, for the slot above the list. */
export function savingNeedingAttention(rows: readonly SavingRow[]): SavingRow | null {
  return rows.find((row) => row.warnings.length > 0) ?? null;
}
