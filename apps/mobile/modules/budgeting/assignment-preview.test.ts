import { describe, expect, it } from "@jest/globals";

import { applyMoveToProjection } from "./assignment-preview";
import { moveMoneyRequest } from "./assignment-test-support";
import type { BudgetProjection, EnvelopeSummary, MoveMoneyRequest } from "./types";

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

const request = (overrides: Partial<MoveMoneyRequest> = {}): MoveMoneyRequest =>
  moveMoneyRequest(overrides) as MoveMoneyRequest;

describe("applyMoveToProjection", () => {
  it("moves unassigned money into a destination Envelope", () => {
    const after = applyMoveToProjection(
      projection(),
      request({ sourceEnvelopeId: null, destinationEnvelopeId: "envelope-one", amountMinor: 25_00 }),
    );

    expect(after.unassignedMoney.amountMinor).toBe(75_00);
    expect(after.envelopes.find(({ id }) => id === "envelope-one")?.availableMoney.amountMinor).toBe(
      65_00,
    );
    expect(after.envelopes.find(({ id }) => id === "envelope-two")?.availableMoney.amountMinor).toBe(
      60_00,
    );
  });

  it("moves between Envelopes and honors an explicit destination available override", () => {
    const after = applyMoveToProjection(
      projection(),
      request({
        sourceEnvelopeId: "envelope-two",
        destinationEnvelopeId: "envelope-one",
        amountMinor: 10_00,
      }),
      55_00,
    );

    expect(after.envelopes.find(({ id }) => id === "envelope-two")?.availableMoney.amountMinor).toBe(
      50_00,
    );
    expect(after.envelopes.find(({ id }) => id === "envelope-one")?.availableMoney.amountMinor).toBe(
      55_00,
    );
    expect(after.unassignedMoney.amountMinor).toBe(100_00);
  });
});
