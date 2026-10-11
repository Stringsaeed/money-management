import type { V2EnvelopeTotals } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../home/home-model";

export type BillStatus =
  | { readonly kind: "paid" }
  | { readonly kind: "ready" }
  | { readonly kind: "short"; readonly shortMinor: number }
  | { readonly kind: "unplanned" };

/**
 * Where a Bills envelope stands this period, from its own numbers. `dueMinor` is what is still to
 * pay this period; without Recurring due data it is the plan that has not been spent yet.
 * Short means Left cannot cover it, which with envelope numbers alone is an overspend.
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
