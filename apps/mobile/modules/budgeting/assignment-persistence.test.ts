import { describe, expect, it } from "@jest/globals";

import { createReversalRequest, type AssignmentRow } from "./assignment-persistence";
import type { CorrectMoveMoneyRequest } from "./types";

const original = (overrides: Partial<AssignmentRow> = {}): AssignmentRow => ({
  id: "assignment-1",
  currency: "USD",
  budgetPeriod: "2026-08",
  sourceEnvelopeId: "envelope-available",
  destinationEnvelopeId: "envelope-groceries",
  amountMinor: 40_00,
  reversesAssignmentId: null,
  kind: "original",
  createdAt: "2026-08-10T12:00:00.000Z",
  ...overrides,
});

const correction = (
  overrides: Partial<CorrectMoveMoneyRequest> = {},
): CorrectMoveMoneyRequest => ({
  id: "correction-move-1",
  currency: "USD",
  period: "2026-08",
  sourceEnvelopeId: "envelope-available",
  destinationEnvelopeId: "envelope-rent",
  amountMinor: 40_00,
  now: "2026-08-12T09:00:00.000Z",
  originalAssignmentId: "assignment-1",
  reversalId: "reversal-1",
  ...overrides,
});

describe("createReversalRequest", () => {
  it("swaps source and destination from the original Assignment", () => {
    expect(createReversalRequest(original(), correction())).toEqual({
      id: "reversal-1",
      currency: "USD",
      period: "2026-08",
      sourceEnvelopeId: "envelope-groceries",
      destinationEnvelopeId: "envelope-available",
      amountMinor: 40_00,
      now: "2026-08-12T09:00:00.000Z",
    });
  });

  it("uses the correction reversal id, currency, period, and now", () => {
    expect(
      createReversalRequest(
        original({ amountMinor: 12_50, sourceEnvelopeId: "a", destinationEnvelopeId: "b" }),
        correction({
          reversalId: "reversal-9",
          currency: "AED",
          period: "2026-09",
          now: "2026-09-01T00:00:00.000Z",
        }),
      ),
    ).toEqual({
      id: "reversal-9",
      currency: "AED",
      period: "2026-09",
      sourceEnvelopeId: "b",
      destinationEnvelopeId: "a",
      amountMinor: 12_50,
      now: "2026-09-01T00:00:00.000Z",
    });
  });
});
