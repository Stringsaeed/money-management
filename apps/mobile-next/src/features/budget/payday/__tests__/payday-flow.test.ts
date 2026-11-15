import {
  nextPaydayStep,
  PAYDAY_ROUTES,
  paydayStepOf,
  paydayStepPosition,
  paydaySteps,
} from "../payday-flow";

const facts = (hasPrevious: boolean, leftoversMinor: number) => ({ hasPrevious, leftoversMinor });

describe("paydaySteps", () => {
  it("walks wrap-up, leftovers and plan when all apply", () => {
    expect(paydaySteps(facts(true, 16_000))).toEqual(["wrapUp", "leftovers", "plan"]);
  });

  it("skips the steps that don't apply, as nextPaydayStep does", () => {
    expect(paydaySteps(facts(false, 16_000))).toEqual(["leftovers", "plan"]);
    expect(paydaySteps(facts(true, 0))).toEqual(["wrapUp", "plan"]);
    expect(paydaySteps(facts(false, 0))).toEqual(["plan"]);
    expect(nextPaydayStep("gotPaid", facts(false, 0))).toBe(PAYDAY_ROUTES.plan);
  });
});

describe("paydayStepPosition", () => {
  it("numbers each step and marks the first", () => {
    const all = facts(true, 16_000);
    expect(paydayStepPosition("wrapUp", all)).toEqual({ step: 1, of: 3, first: true });
    expect(paydayStepPosition("leftovers", all)).toEqual({ step: 2, of: 3, first: false });
    expect(paydayStepPosition("plan", all)).toEqual({ step: 3, of: 3, first: false });
  });

  it("counts a skipped step as the first", () => {
    expect(paydayStepPosition("leftovers", facts(false, 0))).toEqual({
      step: 1,
      of: 1,
      first: true,
    });
  });
});

describe("paydayStepOf", () => {
  it("names the step a route opens", () => {
    expect(paydayStepOf(PAYDAY_ROUTES.wrapUp)).toBe("wrapUp");
    expect(paydayStepOf(PAYDAY_ROUTES.leftovers)).toBe("leftovers");
    expect(paydayStepOf(PAYDAY_ROUTES.plan)).toBe("plan");
    expect(paydayStepOf(PAYDAY_ROUTES.gotPaid)).toBeNull();
  });
});
