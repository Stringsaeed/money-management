/**
 * Assignment waterfall & funding-pool arithmetic (#90), ported from the
 * client's `modules/budgeting` logic as pure functions — no I/O, so the
 * command handler can run them inside the plan phase and tests can exercise
 * them without a database.
 *
 * The waterfall (ADR-0004, backend-architecture "Sync protocol" §10): when an
 * Assignment lands on an Envelope, it is consumed in strict order —
 *
 * 1. Cash Envelope Overspending (negative availability) is covered first;
 * 2. then the envelope's oldest Unfunded Card Spending (FIFO by spend date);
 * 3. only the remainder becomes new availability.
 */

export interface WaterfallInput {
  /** Assignment amount in minor units; always positive. */
  readonly amountMinor: number;
  /** Destination envelope availability BEFORE the assignment (may be negative). */
  readonly destinationAvailableMinor: number;
  /** This envelope's outstanding Unfunded Card Spending (FIFO-ordered total). */
  readonly unfundedCardSpendingMinor: number;
}

export interface WaterfallRouting {
  /** Portion consumed to cover negative availability. */
  readonly cashOverspendingMinor: number;
  /** Portion consumed to cover unfunded card spending. */
  readonly unfundedCardSpendingMinor: number;
  /** Remainder that becomes new envelope availability. */
  readonly newAvailabilityMinor: number;
}

/** Routes one assignment through the consumption waterfall. */
export function routeAssignment(input: WaterfallInput): WaterfallRouting {
  const { amountMinor } = input;
  const cashOverspendingMinor = Math.min(
    Math.max(-input.destinationAvailableMinor, 0),
    amountMinor,
  );
  const unfundedCardSpendingMinor = Math.min(
    amountMinor - cashOverspendingMinor,
    Math.max(input.unfundedCardSpendingMinor, 0),
  );
  return {
    cashOverspendingMinor,
    unfundedCardSpendingMinor,
    newAvailabilityMinor: amountMinor - cashOverspendingMinor - unfundedCardSpendingMinor,
  };
}

/**
 * Unassigned Money (CONTEXT.md): Money contributed by a currency's Funding
 * sources not assigned to any Envelope across current and future periods.
 * Negative means a Budget Shortfall.
 */
export function computeUnassignedMoney(input: {
  readonly fundingPoolMinor: number;
  /** Net assignments out of Unassigned Money through the period. */
  readonly assignedMinor: number;
  /** Card Payment Reserves and other holds (#91 populates this). */
  readonly reservesMinor: number;
}): number {
  return input.fundingPoolMinor - input.assignedMinor - input.reservesMinor;
}

/**
 * Envelope availability after an assignment lands: everything already there
 * plus whatever the waterfall routes to new availability. Availability keeps
 * negative overspending visible; it never silently clamps to zero.
 */
export function applyAssignmentToAvailability(
  availableBeforeMinor: number,
  routing: WaterfallRouting,
): number {
  if (availableBeforeMinor < 0) {
    // Overspending was partially or fully covered first.
    return availableBeforeMinor + routing.cashOverspendingMinor + routing.newAvailabilityMinor;
  }
  return availableBeforeMinor + routing.newAvailabilityMinor;
}
