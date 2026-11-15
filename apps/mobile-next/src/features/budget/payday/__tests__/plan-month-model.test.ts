import {
  lastMonthOf,
  moneyToPlan,
  periodIncome,
  planAccessOf,
  planPrimary,
  planPrimaryButton,
  repeatAccessOf,
} from "../plan-month-model";

describe("moneyToPlan", () => {
  it("splits Not planned yet into income, carried money and plans so far", () => {
    expect(moneyToPlan(1_773_000, 0, 1_700_000)).toEqual({
      incomeMinor: 1_700_000,
      carriedMinor: 73_000,
      plannedMinor: 0,
      totalMinor: 1_773_000,
    });
    const planned = moneyToPlan(1_273_000, 500_000, 1_700_000);
    expect(planned?.carriedMinor).toBe(73_000);
    expect(
      (planned?.incomeMinor ?? 0) + (planned?.carriedMinor ?? 0) - (planned?.plannedMinor ?? 0),
    ).toBe(1_273_000);
  });

  it("prints no lines while the income is unknown", () => {
    expect(moneyToPlan(1_773_000, 0, null)).toBeNull();
  });
});

describe("planPrimary", () => {
  const base = {
    canEditPlan: true,
    mode: "repeat" as const,
    lastMonth: "ready" as const,
    repeat: { itemCount: 3, canRepeat: true },
    adjust: { hasChanges: false, hasProblem: false },
  };

  it("repeats when it fits", () => {
    expect(planPrimary(base)).toEqual({ kind: "repeat" });
  });

  it("waits for last month, and leaves for later when Repeat can't run", () => {
    expect(planPrimary({ ...base, lastMonth: "loading" })).toEqual({ kind: "wait" });
    expect(planPrimary({ ...base, lastMonth: "error" })).toEqual({
      kind: "finish",
      label: "Plan later",
    });
    expect(planPrimary({ ...base, repeat: { itemCount: 3, canRepeat: false } })).toEqual({
      kind: "finish",
      label: "Plan later",
    });
    expect(planPrimary({ ...base, repeat: { itemCount: 0, canRepeat: false } })).toEqual({
      kind: "finish",
      label: "Done",
    });
  });

  it("saves typed amounts, blocks on a problem, and is Done with no changes", () => {
    const adjust = { ...base, mode: "adjust" as const };
    expect(planPrimary(adjust)).toEqual({ kind: "finish", label: "Done" });
    expect(planPrimary({ ...adjust, adjust: { hasChanges: true, hasProblem: false } })).toEqual({
      kind: "adjust",
    });
    expect(planPrimary({ ...adjust, adjust: { hasChanges: true, hasProblem: true } })).toEqual({
      kind: "blocked",
    });
  });

  it("is only Done for someone who can't edit the plan", () => {
    expect(planPrimary({ ...base, canEditPlan: false })).toEqual({ kind: "finish", label: "Done" });
  });
});

describe("access and last month", () => {
  it("reads last month as none, ready, failed or loading", () => {
    expect(lastMonthOf(false, false, false)).toBe("none");
    expect(lastMonthOf(true, true, false)).toBe("ready");
    expect(lastMonthOf(true, false, true)).toBe("error");
    expect(lastMonthOf(true, false, false)).toBe("loading");
  });

  it("offers Repeat only with a last month to someone who can edit the plan", () => {
    expect(planAccessOf(true, true)).toBe("loading");
    expect(planAccessOf(false, false)).toBe("refused");
    expect(repeatAccessOf("ready", "allowed")).toBe("offered");
    expect(repeatAccessOf("ready", "refused")).toBe("refused");
    expect(repeatAccessOf("ready", "loading")).toBe("hidden");
    expect(repeatAccessOf("none", "allowed")).toBe("hidden");
  });

  it("takes the budget currency's income, unknown until the summary loads", () => {
    const summary = {
      count: 2,
      totals: [
        { currency: "USD", count: 1, incomeMinor: 50_000, expenseMinor: 0, netMinor: 50_000 },
        { currency: "AED", count: 1, incomeMinor: 1_700_000, expenseMinor: 0, netMinor: 1_700_000 },
      ],
    };
    expect(periodIncome(summary, false, "AED")).toBe(1_700_000);
    expect(periodIncome(summary, false, "SAR")).toBe(0);
    expect(periodIncome(undefined, false, "AED")).toBeNull();
    expect(periodIncome(summary, true, "AED")).toBeNull();
  });
});

describe("planPrimaryButton", () => {
  it("is Plan my month unless there is nothing to write, and waits or blocks disabled", () => {
    expect(planPrimaryButton({ kind: "repeat" })).toEqual({
      label: "Plan my month",
      disabled: false,
    });
    expect(planPrimaryButton({ kind: "finish", label: "Plan later" })).toEqual({
      label: "Plan later",
      disabled: false,
    });
    expect(planPrimaryButton({ kind: "wait" }).disabled).toBe(true);
    expect(planPrimaryButton({ kind: "blocked" }).disabled).toBe(true);
  });
});
