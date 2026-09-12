import { describe, expect, it } from "@jest/globals";

import { moveMoneyRequest } from "./assignment-test-support";
import { assertSourceHasMoney, validateMoveRequest } from "./assignment-validation";
import type { BudgetProjection, EnvelopeSummary, MoveMoneyRequest } from "./types";

const request = (overrides: Partial<MoveMoneyRequest> = {}): MoveMoneyRequest =>
  moveMoneyRequest(overrides) as MoveMoneyRequest;

const money = (amountMinor: number) => ({ currency: "USD", amountMinor });

const envelope = (id: string, availableMinor: number): EnvelopeSummary => ({
  id,
  currency: "USD",
  name: id,
  icon: "envelope",
  color: "#000000",
  lifecycle: "active",
  sortOrder: 0,
  categoryIds: [],
  positiveRollover: false,
  health: { status: "ready", reasons: [] },
  availableMoney: money(availableMinor),
  assignedMoney: money(availableMinor),
  netSpent: money(0),
});

const projection = (overrides: Partial<BudgetProjection> = {}): BudgetProjection => ({
  currency: "USD",
  period: "2026-08",
  fundingPool: money(200_00),
  unassignedMoney: money(100_00),
  budgetHealth: { status: "ready", reasons: [] },
  envelopes: [envelope("envelope-one", 40_00), envelope("envelope-two", 60_00)],
  archivedEnvelopes: [],
  ...overrides,
});

describe("validateMoveRequest", () => {
  it("returns the current period derived from now for a valid current-period move", () => {
    expect(validateMoveRequest(request())).toBe("2026-08");
  });

  it("rejects past periods unless allowPastPeriod is set", () => {
    expect(() => validateMoveRequest(request({ period: "2026-07" }))).toThrow(
      /current or a future/,
    );
    expect(validateMoveRequest(request({ period: "2026-07" }), { allowPastPeriod: true })).toBe(
      "2026-08",
    );
  });
});

describe("assertSourceHasMoney", () => {
  it("allows moves that fit the unassigned or Envelope source balance", () => {
    expect(() =>
      assertSourceHasMoney(
        request({ sourceEnvelopeId: null, amountMinor: 100_00 }),
        projection(),
      ),
    ).not.toThrow();
    expect(() =>
      assertSourceHasMoney(
        request({
          sourceEnvelopeId: "envelope-one",
          destinationEnvelopeId: "envelope-two",
          amountMinor: 40_00,
        }),
        projection(),
      ),
    ).not.toThrow();
  });

  it("rejects overdraws and missing Envelope sources", () => {
    expect(() =>
      assertSourceHasMoney(
        request({ sourceEnvelopeId: null, amountMinor: 100_01 }),
        projection(),
      ),
    ).toThrow(/more Money than the source owns/);
    expect(() =>
      assertSourceHasMoney(
        request({
          sourceEnvelopeId: "missing-envelope",
          destinationEnvelopeId: "envelope-one",
          amountMinor: 1,
        }),
        projection(),
      ),
    ).toThrow(/source is unavailable/);
  });
});
