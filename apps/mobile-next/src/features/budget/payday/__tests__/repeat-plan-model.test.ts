import type { V2Envelope, V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { repeatGroups, repeatInput, repeatPlan } from "../repeat-plan-model";

const envelope = (
  id: string,
  group: V2EnvelopeGroup,
  extra: Pick<V2Envelope, "targetMinor" | "savingPerPaydayMinor"> = { targetMinor: null },
) => ({ id, name: id, group, ...extra });

const totals = (id: string, budgetedMinor: number, plannedMinor = budgetedMinor) => ({
  id,
  budgetedMinor,
  plannedMinor,
});

const envelopes = [
  envelope("groceries", "everyday"),
  envelope("dewa", "bills"),
  envelope("cushion", "saving", { targetMinor: 1_200_000, savingPerPaydayMinor: 150_000 }),
];
const previous = [totals("groceries", 200_000), totals("dewa", 50_000), totals("cushion", 100_000)];

describe("repeatPlan", () => {
  it("repeats last month's plan and recalculates Saving for from its per-payday amount", () => {
    const plan = repeatPlan({
      envelopes,
      previous,
      current: envelopes.map((item) => totals(item.id, 0)),
      unassignedMinor: 500_000,
    });
    expect(plan.items.map((item) => [item.envelopeId, item.amountMinor])).toEqual([
      ["groceries", 200_000],
      ["dewa", 50_000],
      ["cushion", 150_000],
    ]);
    expect(plan.totalMinor).toBe(400_000);
    expect(plan.canRepeat).toBe(true);
  });

  it("adds only what this period is missing", () => {
    const plan = repeatPlan({
      envelopes,
      previous,
      current: [totals("groceries", 120_000), totals("dewa", 50_000), totals("cushion", 0)],
      unassignedMinor: 500_000,
    });
    expect(plan.items.map((item) => [item.envelopeId, item.amountMinor])).toEqual([
      ["groceries", 80_000],
      ["cushion", 150_000],
    ]);
  });

  it("diffs against the plan, so a leftover, cover or move this period is not refilled", () => {
    // Groceries planned 2,000 last month (net 1,700 after AED 300 moved out); this month the
    // AED 300 leftover went back to Not planned yet (net -300) and Dining was covered with 150.
    const plan = repeatPlan({
      envelopes: [envelope("groceries", "everyday"), envelope("dining", "everyday")],
      previous: [totals("groceries", 200_000, 170_000), totals("dining", 80_000, 95_000)],
      current: [totals("groceries", 0, -30_000), totals("dining", 0, 15_000)],
      unassignedMinor: 900_000,
    });
    expect(plan.items.map((item) => [item.envelopeId, item.amountMinor])).toEqual([
      ["groceries", 200_000],
      ["dining", 80_000],
    ]);
    expect(plan.totalMinor).toBe(280_000);
  });

  it("reports the shortfall and blocks Repeat when the money is not there", () => {
    const plan = repeatPlan({
      envelopes,
      previous,
      current: envelopes.map((item) => totals(item.id, 0)),
      unassignedMinor: 300_000,
    });
    expect(plan.shortMinor).toBe(100_000);
    expect(plan.canRepeat).toBe(false);
  });

  it("treats negative Not planned yet as no money at all", () => {
    const plan = repeatPlan({
      envelopes,
      previous,
      current: envelopes.map((item) => totals(item.id, 0)),
      unassignedMinor: -50_000,
    });
    expect(plan.availableMinor).toBe(0);
    expect(plan.shortMinor).toBe(400_000);
  });

  it("has nothing to repeat without a previous period or when everything is planned", () => {
    expect(
      repeatPlan({ envelopes, previous: [], current: [], unassignedMinor: 900_000 }).canRepeat,
    ).toBe(false);
    expect(
      repeatPlan({
        envelopes: [envelope("groceries", "everyday")],
        previous,
        current: [totals("groceries", 200_000)],
        unassignedMinor: 900_000,
      }).canRepeat,
    ).toBe(false);
  });

  it("writes one batch of repeat assignments from Not planned yet", () => {
    const plan = repeatPlan({
      envelopes: [envelope("groceries", "everyday")],
      previous,
      current: [totals("groceries", 0)],
      unassignedMinor: 900_000,
    });
    expect(repeatInput(plan)).toEqual({
      items: [
        { fromEnvelopeId: null, toEnvelopeId: "groceries", amountMinor: 200_000, reason: "repeat" },
      ],
    });
  });
});

describe("repeatGroups", () => {
  it("sums what Repeat adds per group and flags a recalculated Saving for", () => {
    const plan = repeatPlan({
      envelopes,
      previous,
      current: envelopes.map((item) => totals(item.id, 0)),
      unassignedMinor: 500_000,
    });
    expect(repeatGroups(plan)).toEqual([
      { group: "bills", amountMinor: 50_000, recalculated: false },
      { group: "everyday", amountMinor: 200_000, recalculated: false },
      { group: "saving", amountMinor: 150_000, recalculated: true },
    ]);
  });

  it("repeats a Saving for without a per-payday amount from last month's plan", () => {
    const plan = repeatPlan({
      envelopes: [envelope("trip", "saving", { targetMinor: 300_000 })],
      previous: [totals("trip", 40_000)],
      current: [totals("trip", 0)],
      unassignedMinor: 500_000,
    });
    expect(plan.items).toEqual([
      {
        envelopeId: "trip",
        name: "trip",
        group: "saving",
        recalculated: false,
        amountMinor: 40_000,
      },
    ]);
  });
});
