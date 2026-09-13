import { describe, expect, it } from "vitest";

import {
  applyAssignmentToAvailability,
  computeUnassignedMoney,
  routeAssignment,
} from "@trove/domain/assignment-waterfall";

describe("routeAssignment", () => {
  it("routes everything to new availability when the envelope is healthy", () => {
    expect(
      routeAssignment({
        amountMinor: 5000,
        destinationAvailableMinor: 2000,
        unfundedCardSpendingMinor: 0,
      }),
    ).toEqual({
      cashOverspendingMinor: 0,
      unfundedCardSpendingMinor: 0,
      newAvailabilityMinor: 5000,
    });
  });

  it("consumes cash overspending first", () => {
    const routing = routeAssignment({
      amountMinor: 3000,
      destinationAvailableMinor: -1200,
      unfundedCardSpendingMinor: 0,
    });
    expect(routing.cashOverspendingMinor).toBe(1200);
    expect(routing.unfundedCardSpendingMinor).toBe(0);
    expect(routing.newAvailabilityMinor).toBe(1800);
  });

  it("covers unfunded card spending second", () => {
    const routing = routeAssignment({
      amountMinor: 3000,
      destinationAvailableMinor: -1000,
      unfundedCardSpendingMinor: 800,
    });
    expect(routing.cashOverspendingMinor).toBe(1000);
    expect(routing.unfundedCardSpendingMinor).toBe(800);
    expect(routing.newAvailabilityMinor).toBe(1200);
  });

  it("stops at new availability when the amount cannot clear all deficits", () => {
    const routing = routeAssignment({
      amountMinor: 1000,
      destinationAvailableMinor: -600,
      unfundedCardSpendingMinor: 900,
    });
    // 600 covers overspending; the remaining 400 partially clears card debt.
    expect(routing.cashOverspendingMinor).toBe(600);
    expect(routing.unfundedCardSpendingMinor).toBe(400);
    expect(routing.newAvailabilityMinor).toBe(0);
  });
});

describe("applyAssignmentToAvailability", () => {
  it("keeps residual overspending visible instead of clamping to zero", () => {
    expect(
      applyAssignmentToAvailability(
        -900,
        routeAssignment({
          amountMinor: 500,
          destinationAvailableMinor: -900,
          unfundedCardSpendingMinor: 0,
        }),
      ),
    ).toBe(-400);
  });

  it("adds new availability on healthy envelopes", () => {
    expect(
      applyAssignmentToAvailability(
        1500,
        routeAssignment({
          amountMinor: 2000,
          destinationAvailableMinor: 1500,
          unfundedCardSpendingMinor: 0,
        }),
      ),
    ).toBe(3500);
  });
});

describe("computeUnassignedMoney", () => {
  it("subtracts assignments and reserves from the funding pool", () => {
    expect(
      computeUnassignedMoney({
        fundingPoolMinor: 10_000,
        assignedMinor: 6_000,
        reservesMinor: 1_000,
      }),
    ).toBe(3_000);
  });

  it("reports a Budget Shortfall as negative Unassigned Money", () => {
    expect(
      computeUnassignedMoney({ fundingPoolMinor: 4_000, assignedMinor: 5_000, reservesMinor: 0 }),
    ).toBe(-1_000);
  });
});
