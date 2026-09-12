import { describe, expect, it } from "vitest";

import { routeCardPayment } from "./card-waterfall";

describe("routeCardPayment", () => {
  it("consumes reserve, then opening debt, then unassigned, with remainder as card credit", () => {
    expect(
      routeCardPayment({
        amountMinor: 10_000,
        reserveMinor: 2_000,
        fundedOpeningDebtMinor: 3_000,
        unassignedMinor: 4_000,
        unfundedCardSpendingMinor: 5_000,
      }),
    ).toEqual({
      reserveConsumedMinor: 2_000,
      openingDebtConsumedMinor: 3_000,
      unassignedConsumedMinor: 2_000,
      cardCreditMinor: 3_000,
    });
  });

  it("returns zero consumption when amount is zero", () => {
    expect(
      routeCardPayment({
        amountMinor: 0,
        reserveMinor: 100,
        fundedOpeningDebtMinor: 100,
        unassignedMinor: 100,
        unfundedCardSpendingMinor: 100,
      }),
    ).toEqual({
      reserveConsumedMinor: 0,
      openingDebtConsumedMinor: 0,
      unassignedConsumedMinor: 0,
      cardCreditMinor: 0,
    });
  });
});
