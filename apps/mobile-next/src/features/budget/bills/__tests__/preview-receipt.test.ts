import { previewReceipt } from "../preview-receipt";

const base = {
  stillNeededMinor: 500_000,
  perPaydayMinor: 250_000,
  paydaysLeft: 2,
  paydayDates: ["2026-10-25", "2026-11-25"],
  shortBeforePaydayMinor: null,
};

describe("previewReceipt", () => {
  it("spreads what is still needed over the paydays before it is due", () => {
    expect(
      previewReceipt({
        preview: base,
        dueDate: "2026-12-01",
        repeat: "every_3_months",
        currency: "AED",
      }),
    ).toEqual({
      lines: [
        { label: "STILL NEEDED", value: "5,000" },
        { label: "PAYDAYS · 25 OCT, 25 NOV", value: "÷ 2" },
      ],
      total: { label: "SET ASIDE EACH PAYDAY", value: "AED 2,500", tone: "ok" },
      sentence: "After 1 Dec, the next one (1 Mar) starts at 0 and we work it out again.",
    });
  });

  it("shows a range for many paydays and a one-off's sentence", () => {
    const receipt = previewReceipt({
      preview: {
        ...base,
        paydaysLeft: 3,
        paydayDates: ["2026-10-25", "2026-11-25", "2026-12-25"],
      },
      dueDate: "2026-12-30",
      repeat: "once",
      currency: "AED",
    });
    expect(receipt.lines[1]).toEqual({ label: "PAYDAYS · 25 OCT – 25 DEC", value: "÷ 3" });
    expect(receipt.sentence).toBe("It's a one-off, so its target clears once it's paid.");
  });

  it("warns when it is due before payday", () => {
    const receipt = previewReceipt({
      preview: { ...base, paydaysLeft: 1, paydayDates: [], shortBeforePaydayMinor: 500_000 },
      dueDate: "2026-10-20",
      repeat: "once",
      currency: "AED",
    });
    expect(receipt.lines[1]).toEqual({ label: "PAYDAYS BEFORE 20 OCT", value: "0" });
    expect(receipt.total).toEqual({ label: "SHORT ON 20 OCT", value: "AED 5,000", tone: "warn" });
  });
});
