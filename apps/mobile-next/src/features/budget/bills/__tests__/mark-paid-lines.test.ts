import {
  afterPayment,
  afterPaymentSentence,
  leftAfterValue,
  markPaidStamp,
  nextDueNote,
  paidOnLabel,
} from "../mark-paid-lines";

const TODAY = "2026-12-01";

describe("mark paid lines", () => {
  it("stamps when the payment is due", () => {
    expect(markPaidStamp("2026-12-01", TODAY)).toBe("DUE TODAY · TUE 1 DEC");
    expect(markPaidStamp("2026-11-28", TODAY)).toBe("OVERDUE · SAT 28 NOV");
    expect(markPaidStamp("2027-03-01", TODAY)).toBe("DUE MON 1 MAR");
    expect(markPaidStamp(null, TODAY)).toBe("BIG PAYMENT");
  });

  it("labels the paid-on date", () => {
    expect(paidOnLabel(TODAY, TODAY)).toBe("Today, 1 Dec");
    expect(paidOnLabel("2026-11-28", TODAY)).toBe("Sat 28 Nov");
  });

  it("works out what is left after paying", () => {
    const exact = afterPayment(1_500_000, 1_500_000);
    expect(exact).toEqual({ leftAfterMinor: 0, over: false });
    expect(leftAfterValue(exact, "AED")).toBe("0.00 ✓");
    expect(afterPaymentSentence(exact, "AED")).toBe(
      "Fully set aside, so Safe to spend doesn't move.",
    );
    const under = afterPayment(1_500_000, 1_450_000);
    expect(leftAfterValue(under, "AED")).toBe("500.00");
    expect(afterPaymentSentence(under, "AED")).toBe(
      "AED 500 stays set aside, and Safe to spend doesn't move.",
    );
    const over = afterPayment(1_500_000, 1_550_000);
    expect(over.over).toBe(true);
    expect(leftAfterValue(over, "AED")).toBe("−500.00");
    expect(afterPaymentSentence(over, "AED")).toContain("AED 500 more than is set aside");
  });

  it("says what comes next", () => {
    expect(
      nextDueNote({ dueDate: TODAY, repeat: "every_3_months", targetMinor: 1_500_000 }, "AED"),
    ).toBe("NEXT · 1 MAR 2027 · AED 15,000");
    expect(nextDueNote({ dueDate: TODAY, repeat: "once", targetMinor: 1_500_000 }, "AED")).toBe(
      "ONE-OFF · TARGET CLEARS ONCE PAID",
    );
  });
});
