import { historyStarts, paceMinor, planChange } from "../envelope-model";

describe("paceMinor", () => {
  it("floors the daily pace to whole AED", () => {
    // AED 480.00 over 10 days is AED 48.00; AED 475.00 over 10 days is 47.50 -> 47.
    expect(paceMinor(48_000, 10)).toBe(4_800);
    expect(paceMinor(47_500, 10)).toBe(4_700);
  });

  it("is zero when nothing is left or the period is over", () => {
    expect(paceMinor(0, 5)).toBe(0);
    expect(paceMinor(-2_000, 5)).toBe(0);
    expect(paceMinor(10_000, 0)).toBe(0);
  });
});

describe("planChange", () => {
  const base = {
    envelopeId: "env",
    plannedMinor: 50_000,
    leftMinor: 20_000,
    unassignedMinor: 30_000,
  };

  it("raises the plan from Not planned yet", () => {
    expect(planChange({ ...base, nextPlannedMinor: 60_000 })).toEqual({
      kind: "ok",
      input: {
        items: [{ fromEnvelopeId: null, toEnvelopeId: "env", amountMinor: 10_000, reason: "plan" }],
      },
    });
  });

  it("lowers the plan back to Not planned yet", () => {
    expect(planChange({ ...base, nextPlannedMinor: 40_000 })).toEqual({
      kind: "ok",
      input: {
        items: [{ fromEnvelopeId: "env", toEnvelopeId: null, amountMinor: 10_000, reason: "plan" }],
      },
    });
  });

  it("does nothing when the plan is unchanged", () => {
    expect(planChange({ ...base, nextPlannedMinor: 50_000 })).toEqual({ kind: "same" });
  });

  it("stops at what Not planned yet can give", () => {
    expect(planChange({ ...base, nextPlannedMinor: 90_000 })).toEqual({
      kind: "over_unplanned",
      maxPlannedMinor: 80_000,
    });
    expect(planChange({ ...base, unassignedMinor: -5_000, nextPlannedMinor: 50_100 })).toEqual({
      kind: "over_unplanned",
      maxPlannedMinor: 50_000,
    });
  });

  it("will not take back money that is already spent", () => {
    expect(planChange({ ...base, nextPlannedMinor: 10_000 })).toEqual({
      kind: "below_spent",
      minPlannedMinor: 30_000,
    });
    expect(planChange({ ...base, leftMinor: -4_000, nextPlannedMinor: 49_000 })).toEqual({
      kind: "below_spent",
      minPlannedMinor: 50_000,
    });
  });
});

describe("historyStarts", () => {
  it("walks back to the activation period, newest first", () => {
    expect(historyStarts({ kind: "day", day: 25 }, "2026-10-25", "2026-08-25")).toEqual([
      "2026-09-25",
      "2026-08-25",
    ]);
  });

  it("is empty in the activation period", () => {
    expect(historyStarts({ kind: "day", day: 25 }, "2026-10-25", "2026-10-25")).toEqual([]);
  });
});
