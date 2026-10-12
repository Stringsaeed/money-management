import type { V2BudgetView, V2Envelope, V2EnvelopeTotals } from "@trove/api/v2/contracts";

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
