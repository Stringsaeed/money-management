import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

import { activitySentence } from "../activity-sentence";

const money = (minor: number) => `AED ${(minor / 100).toFixed(2)}`;

const item = (overrides: Partial<V2BudgetActivityItem>): V2BudgetActivityItem => ({
  id: "a1",
  periodStart: "2026-10-01",
  fromEnvelopeId: "e1",
  fromName: "Dining",
  toEnvelopeId: "e2",
  toName: "Groceries",
  amountMinor: 10_000,
  reason: "move",
  createdBy: "u1",
  createdByName: "Sara",
  createdAt: "2026-10-05T08:00:00.000Z",
  ...overrides,
});

describe("activitySentence", () => {
  it("says who moved how much from where to where", () => {
    expect(activitySentence(item({}), money)).toBe(
      "Sara moved AED 100.00 from Dining to Groceries",
    );
  });

  it("falls back to Someone when the person has no name", () => {
    expect(activitySentence(item({ createdByName: null }), money)).toBe(
      "Someone moved AED 100.00 from Dining to Groceries",
    );
    expect(activitySentence(item({ createdByName: "  " }), money)).toBe(
      "Someone moved AED 100.00 from Dining to Groceries",
    );
  });

  it("reads planning from Not planned yet as a plan", () => {
    expect(activitySentence(item({ fromName: null, reason: "plan" }), money)).toBe(
      "Sara planned AED 100.00 for Groceries",
    );
  });

  it("reads taking money back to Not planned yet", () => {
    expect(activitySentence(item({ toName: null, reason: "plan" }), money)).toBe(
      "Sara took AED 100.00 out of Dining",
    );
  });

  it("reads a pay-back into Not planned yet as paying back last month's overspend", () => {
    expect(activitySentence(item({ reason: "cover", toName: null }), money)).toBe(
      "Sara paid back AED 100.00 of last month's overspend from Dining",
    );
  });

  it("reads a cover as covering the envelope that was over", () => {
    expect(activitySentence(item({ reason: "cover" }), money)).toBe(
      "Sara covered Groceries with AED 100.00 from Dining",
    );
    expect(activitySentence(item({ reason: "cover", fromName: null }), money)).toBe(
      "Sara covered Groceries with AED 100.00 from Not planned yet",
    );
  });
});
