import { describe, expect, it } from "vitest";

import {
  applyAssignmentToAvailability,
  computeUnassignedMoney,
  routeAssignment,
} from "./assignment-waterfall";

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

describe("computeUnassignedMoney", () => {
  it("subtracts assigned money and reserves from the funding pool", () => {
    expect(
      computeUnassignedMoney({
        fundingPoolMinor: 10_000,
        assignedMinor: 4_000,
        reservesMinor: 1_500,
      }),
    ).toBe(4_500);
  });

  it("returns a negative shortfall when assignments exceed funding", () => {
    expect(
      computeUnassignedMoney({
        fundingPoolMinor: 1_000,
        assignedMinor: 2_000,
        reservesMinor: 500,
      }),
    ).toBe(-1_500);
  });
});

describe("applyAssignmentToAvailability", () => {
  it("adds overspend cover and new availability when starting negative", () => {
    expect(
      applyAssignmentToAvailability(-3_000, {
        cashOverspendingMinor: 3_000,
        unfundedCardSpendingMinor: 2_000,
        newAvailabilityMinor: 1_000,
      }),
    ).toBe(1_000);
  });

  it("adds only new availability when starting non-negative", () => {
    expect(
      applyAssignmentToAvailability(2_000, {
        cashOverspendingMinor: 0,
        unfundedCardSpendingMinor: 500,
        newAvailabilityMinor: 1_500,
      }),
    ).toBe(3_500);
  });
});
