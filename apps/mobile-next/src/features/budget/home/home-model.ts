import type {
  V2BudgetView,
  V2Envelope,
  V2EnvelopeGroup,
  V2EnvelopeTotals,
} from "@trove/api/v2/contracts";

export type ActiveBudgetView = Exclude<V2BudgetView, { budget: null }>;

export interface EnvelopeLine {
  readonly envelope: V2Envelope;
  readonly totals: V2EnvelopeTotals;
}

/** Active envelopes paired with this period's numbers, in the server's sort order. */
export function envelopeLines(view: ActiveBudgetView): EnvelopeLine[] {
  const totalsById = new Map(view.current.envelopes.map((totals) => [totals.id, totals]));
  return view.envelopes.flatMap((envelope) => {
    const totals = totalsById.get(envelope.id);
    return totals && !envelope.archived ? [{ envelope, totals }] : [];
  });
}

export interface EnvelopeProgress {
  /** Share of this period's money still left, 0 to 1. A bar that is over shows full. */
  readonly fraction: number;
  readonly over: boolean;
}

/** Left against planned plus rollover. Negative Left is shown as over, never as a negative bar. */
export function envelopeProgress(
  totals: Pick<V2EnvelopeTotals, "plannedMinor" | "rolloverMinor" | "leftMinor">,
): EnvelopeProgress {
  if (totals.leftMinor < 0) return { fraction: 1, over: true };
  const available = totals.plannedMinor + totals.rolloverMinor;
  if (available <= 0) return { fraction: 0, over: false };
  return { fraction: Math.min(totals.leftMinor / available, 1), over: false };
}

export interface GroupSummary {
  readonly count: number;
  readonly leftMinor: number;
  /** Planned plus rollover: what the group started the period with. */
  readonly availableMinor: number;
}

export function groupSummary(lines: readonly EnvelopeLine[], group: V2EnvelopeGroup): GroupSummary {
  return lines
    .filter((line) => line.envelope.group === group)
    .reduce<GroupSummary>(
      (sum, { totals }) => ({
        count: sum.count + 1,
        leftMinor: sum.leftMinor + totals.leftMinor,
        availableMinor: sum.availableMinor + totals.plannedMinor + totals.rolloverMinor,
      }),
      { count: 0, leftMinor: 0, availableMinor: 0 },
    );
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "about AED 120.00 a day · 9 days to payday", or "AED 0 a day" when nothing is safe to spend. */
export function perDayLine(
  view: Pick<ActiveBudgetView["current"], "safeToSpendMinor" | "perDayMinor" | "daysLeft">,
  money: (minor: number) => string,
): string {
  const days = plural(view.daysLeft, "day", "days");
  return view.safeToSpendMinor <= 0
    ? `${money(0)} a day · ${days} to payday`
    : `about ${money(view.perDayMinor)} a day · ${days} to payday`;
}

/**
 * Why nothing is safe to spend, or `null` when something is. Exactly zero is not a problem (all
 * the money has a job); below zero the person has planned or spent more than they have.
 */
export function noSafeToSpendReason(safeToSpendMinor: number): string | null {
  if (safeToSpendMinor > 0) return null;
  return safeToSpendMinor === 0
    ? "Everything is planned"
    : "You've planned or spent more than you have";
}
