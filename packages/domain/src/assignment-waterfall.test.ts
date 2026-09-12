import { describe, expect, it } from "vitest";

import { routeAssignment } from "./assignment-waterfall";

describe("routeAssignment", () => {
  it("covers cash overspending first, then unfunded card spending, then new availability", () => {
    expect(
      routeAssignment({
        amountMinor: 10_000,
        destinationAvailableMinor: -3_000,
        unfundedCardSpendingMinor: 4_000,
      }),
    ).toEqual({
      cashOverspendingMinor: 3_000,
      unfundedCardSpendingMinor: 4_000,
      newAvailabilityMinor: 3_000,
    });
  });

  it("routes the full amount to new availability when there is no overspend or unfunded debt", () => {
    expect(
      routeAssignment({
        amountMinor: 5_000,
        destinationAvailableMinor: 1_000,
        unfundedCardSpendingMinor: 0,
      }),
    ).toEqual({
      cashOverspendingMinor: 0,
      unfundedCardSpendingMinor: 0,
      newAvailabilityMinor: 5_000,
    });
  });
});
