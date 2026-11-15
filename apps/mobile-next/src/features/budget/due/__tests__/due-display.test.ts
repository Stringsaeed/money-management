import {
  dayOrdinal,
  dueFigure,
  dueStamp,
  dueWhen,
  markPaidStamp,
  paidWhen,
  paymentDateLabel,
} from "../due-display";

describe("due display", () => {
  it("stamps the header with today's date", () => {
    expect(dueStamp("2026-10-11")).toBe("SUN 11.10.26");
  });

  it("prints when a bill is due and when one was paid", () => {
    expect(dueWhen("2026-10-18")).toBe("SUN 18 OCT");
    expect(paidWhen("2026-10-01")).toBe("1 OCT");
    expect(dayOrdinal("2026-10-18")).toBe("18th");
  });

  it("labels the payment date, naming today", () => {
    expect(paymentDateLabel("2026-10-11", "2026-10-11")).toBe("Today, 11 Oct");
    expect(paymentDateLabel("2026-10-10", "2026-10-11")).toBe("Sat, 10 Oct");
  });

  it("prints a bill's figure bare, naming a foreign currency", () => {
    expect(dueFigure(185_000, "AED", "AED")).toBe("1,850.00");
    expect(dueFigure(-5_000, "USD", "AED")).toBe("USD 50.00");
  });

  it("stamps the Mark paid sheet by when the bill is due", () => {
    const today = "2026-10-11";
    expect(markPaidStamp({ scheduledDate: today, overdue: false }, today)).toBe(
      "Due today · SUN 11 OCT",
    );
    expect(markPaidStamp({ scheduledDate: "2026-10-04", overdue: true }, today)).toBe(
      "Overdue · was due SUN 4 OCT",
    );
    expect(markPaidStamp({ scheduledDate: "2026-10-18", overdue: false }, today)).toBe(
      "Due · SUN 18 OCT",
    );
  });
});
