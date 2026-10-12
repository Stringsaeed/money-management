import { onPlanStamp, overspendTitle, raiseSentence, wrapUpLines } from "../wrap-up-copy";
import type { WrapUpSummary } from "../wrap-up-model";

const summary: WrapUpSummary = {
  envelopeCount: 11,
  onPlanCount: 10,
  everyday: { spentMinor: 298_000, plannedMinor: 310_000 },
  bills: { paid: 4, total: 4 },
  billsSpentMinor: 467_500,
  savedMinor: 569_500,
  overspent: [{ id: "dining", name: "Dining & coffee", overMinor: 4_000 }],
};

describe("wrap-up receipt", () => {
  it("stamps how many envelopes ended on plan", () => {
    expect(onPlanStamp(summary)).toBe("ON PLAN · 10 OF 11");
  });

  it("prints Everyday, Bills and set-aside lines", () => {
    expect(wrapUpLines(summary, false, "AED").map((line) => [line.label, line.value])).toEqual([
      ["EVERYDAY · 2,980 OF", "3,100"],
      ["BILLS PAID · 4 OF 4", "4,675 ✓"],
      ["SET ASIDE FOR BIG ONES", "5,695"],
    ]);
  });

  it("marks Everyday over, leaves the tick off unpaid bills, and shows only Everyday in a first month", () => {
    const over = { ...summary, everyday: { spentMinor: 320_000, plannedMinor: 310_000 } };
    expect(wrapUpLines(over, false, "AED")[0]?.over).toBe(true);
    const unpaid = { ...summary, bills: { paid: 3, total: 4 } };
    expect(wrapUpLines(unpaid, false, "AED")[1]?.value).toBe("4,675");
    expect(wrapUpLines(summary, true, "AED").map((line) => line.key)).toEqual(["everyday"]);
  });
});

describe("wrap-up sentences", () => {
  it("names overspend and the raise as the board does", () => {
    expect(overspendTitle({ id: "d", name: "Dining & coffee", overMinor: 4_000 }, "AED")).toBe(
      "Dining & coffee: 40 not covered",
    );
    expect(raiseSentence({ envelopeId: "d", name: "Dining", suggestedMinor: 65_000 }, "AED")).toBe(
      "Dining went over 3 months running. Plan 650 next month?",
    );
  });
});
