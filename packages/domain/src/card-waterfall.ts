/**
 * Card Payment waterfall (#91), per ADR-0011 and ADR-0014: a Card Payment is
 * a same-currency transfer from a Funding Account to the card Account that
 * consumes liability in strict order —
 *
 * 1. the envelope-funded Card Payment Reserve;
 * 2. funded Opening Card Debt (debt deliberately assigned to the reserve);
 * 3. Unassigned Money, applied against Unfunded Card Spending;
 * 4. any amount beyond total liability becomes Card Credit (ADR-0014) and
 *    returns to Unassigned Money rather than vanishing.
 */

export interface CardPaymentInput {
  /** Payment amount in minor units; always positive. */
  readonly amountMinor: number;
  /** Card Payment Reserve available for this currency/period. */
  readonly reserveMinor: number;
  /** Opening Card Debt that has been funded by assignment (ADR-0010). */
  readonly fundedOpeningDebtMinor: number;
  /** Unassigned Money in the workspace before the payment. */
  readonly unassignedMinor: number;
  /** Total unfunded card spending outstanding (reserve-uncovered debt). */
  readonly unfundedCardSpendingMinor: number;
}

export interface CardPaymentRouting {
  /** Portion consumed from the Card Payment Reserve. */
  readonly reserveConsumedMinor: number;
  /** Portion consumed from funded Opening Card Debt. */
  readonly openingDebtConsumedMinor: number;
  /** Portion paid out of Unassigned Money against unfunded spending. */
  readonly unassignedConsumedMinor: number;
  /**
   * Positive when the payment exceeded total liability (ADR-0014): issuer
   * owes the user; this amount returns to Unassigned Money as Card Credit.
   */
  readonly cardCreditMinor: number;
}

/** Routes one card payment through the consumption waterfall. */
export function routeCardPayment(input: CardPaymentInput): CardPaymentRouting {
  let remaining = input.amountMinor;

  const reserveConsumedMinor = Math.min(remaining, Math.max(input.reserveMinor, 0));
  remaining -= reserveConsumedMinor;

  const openingDebtConsumedMinor = Math.min(remaining, Math.max(input.fundedOpeningDebtMinor, 0));
  remaining -= openingDebtConsumedMinor;

  // Unassigned covers only genuine unfunded spending; paying beyond it would
  // manufacture credit where none was owed.
  const unassignedTarget = Math.min(
    remaining,
    Math.max(input.unfundedCardSpendingMinor - openingDebtConsumedMinor, 0),
  );
  const unassignedCoverable = Math.max(input.unassignedMinor, 0);
  const unassignedConsumedMinor = Math.min(
    remaining,
    Math.min(unassignedTarget, unassignedCoverable),
  );
  remaining -= unassignedConsumedMinor;

  return {
    reserveConsumedMinor,
    openingDebtConsumedMinor,
    unassignedConsumedMinor,
    cardCreditMinor: remaining,
  };
}
