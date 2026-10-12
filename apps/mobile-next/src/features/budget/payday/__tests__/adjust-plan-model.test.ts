import { checkAdjust, MAX_ADJUST_ITEMS, type AdjustLine } from "../adjust-plan-model";
import { adjustImpact } from "../adjust-impact";

const line = (envelopeId: string, plannedMinor: number, leftMinor = plannedMinor): AdjustLine => ({
  envelopeId,
  name: envelopeId,
  plannedMinor,
  leftMinor,
});

const lines = [line("groceries", 150_000, 90_000), line("fuel", 40_000, 40_000)];

describe("checkAdjust", () => {
  it("writes nothing when nothing changed", () => {
    const result = checkAdjust(lines, { groceries: "1500.00" }, "AED", 50_000);
    expect(result).toEqual({ leftToPlanMinor: 50_000, problem: null, input: null });
  });

  it("frees money first, then plans it, in one batch", () => {
    const result = checkAdjust(lines, { groceries: "1700", fuel: "200" }, "AED", 10_000);
    expect(result.problem).toBeNull();
    expect(result.leftToPlanMinor).toBe(10_000);
    expect(result.input?.items).toEqual([
      { fromEnvelopeId: "fuel", toEnvelopeId: null, amountMinor: 20_000, reason: "plan" },
      { fromEnvelopeId: null, toEnvelopeId: "groceries", amountMinor: 20_000, reason: "plan" },
    ]);
  });

  it("refuses more than Not planned yet has, net of what is freed", () => {
    const result = checkAdjust(lines, { groceries: "1700" }, "AED", 10_000);
    expect(result.problem).toEqual({ kind: "over_unplanned", overMinor: 10_000 });
    expect(result.leftToPlanMinor).toBe(-10_000);
    expect(result.input).toBeNull();
  });

  it("never plans below what has been spent", () => {
    // Groceries spent 600 of 1,500, so the plan can drop to 600 and no lower.
    expect(checkAdjust(lines, { groceries: "600" }, "AED", 0).problem).toBeNull();
    expect(checkAdjust(lines, { groceries: "500" }, "AED", 0).problem).toEqual({
      kind: "below_spent",
      name: "groceries",
      minPlannedMinor: 60_000,
    });
  });

  it("reads an empty amount as 0 and flags one it can't read", () => {
    expect(checkAdjust(lines, { fuel: "" }, "AED", 0).input?.items).toEqual([
      { fromEnvelopeId: "fuel", toEnvelopeId: null, amountMinor: 40_000, reason: "plan" },
    ]);
    expect(checkAdjust(lines, { fuel: "abc" }, "AED", 0).problem).toEqual({
      kind: "unreadable",
      name: "fuel",
    });
  });

  it("keeps a batch within what the server takes", () => {
    const many = Array.from({ length: MAX_ADJUST_ITEMS + 1 }, (_, index) => line(`e${index}`, 0));
    const draft = Object.fromEntries(many.map((item) => [item.envelopeId, "1"]));
    expect(checkAdjust(many, draft, "AED", 1_000_000).problem).toEqual({ kind: "too_many" });
  });
});

describe("adjustImpact", () => {
  it("says what stays to plan, or what to fix", () => {
    expect(adjustImpact(checkAdjust(lines, {}, "AED", 426_000), "AED")).toEqual({
      tone: "ok",
      text: "AED 4,260 left to plan",
    });
    expect(adjustImpact(checkAdjust(lines, { groceries: "1700" }, "AED", 10_000), "AED")).toEqual({
      tone: "over",
      text: "AED 100 more than you have to plan",
    });
  });
});
