import type { SetupItem } from "../setup-items";
import {
  everydaySpentLabel,
  figure,
  itemHint,
  leftToPlanMessage,
  moneyLabel,
  perDayNote,
  periodLine,
  receiptPeriodLine,
  remindersLine,
} from "../setup-copy";

const item = (overrides: Partial<SetupItem>): SetupItem => ({
  key: "k",
  name: "k",
  group: "bills",
  categoryId: null,
  defaultTicked: true,
  recurringMinor: null,
  lastPeriodMinor: null,
  ...overrides,
});

describe("setup copy", () => {
  it("prints the period with the days left, today included", () => {
    expect(periodLine({ start: "2026-09-25", end: "2026-10-24" }, "2026-10-11")).toBe(
      "THIS MONTH: 25 SEP → 24 OCT · 14 DAYS LEFT",
    );
    expect(receiptPeriodLine({ start: "2026-09-25", end: "2026-10-24" }, 1)).toBe(
      "25 SEP — 24 OCT · 1 DAY LEFT",
    );
    expect(everydaySpentLabel("2026-09-25")).toBe("EVERYDAY SPENT SINCE 25 SEP");
  });

  it("prints figures bare, with a real minus and decimals only when there are some", () => {
    expect(figure(1_420_000, "AED")).toBe("14,200");
    expect(figure(-25_000, "AED")).toBe("−250");
    expect(figure(7_550, "AED")).toBe("75.50");
    expect(moneyLabel(73_000, "AED")).toBe("AED 730");
  });

  it("says what Left to plan means in each state", () => {
    expect(leftToPlanMessage(73_000, "AED")).toBe(
      "AED 730 not planned yet. It counts as safe to spend.",
    );
    expect(leftToPlanMessage(0, "AED")).toBe("Every dirham has a job ✓");
    expect(leftToPlanMessage(0, "XYZ")).toBe("Every bit has a job ✓");
    expect(leftToPlanMessage(-25_000, "AED")).toBe("⚠︎ Planned AED 250 more than you have");
  });

  it("hints the Recurring amount first, then last month's spend", () => {
    expect(itemHint(item({ recurringMinor: 45_000, lastPeriodMinor: 1 }), "AED")).toBe(
      "Recurring · 450",
    );
    expect(itemHint(item({ lastPeriodMinor: 154_000 }), "AED")).toBe("Last month · 1,540");
    expect(itemHint(item({}), "AED")).toBeUndefined();
  });

  it("prints the daily figure in whole units, never below zero", () => {
    expect(perDayNote(14_299, "AED")).toBe("*** ≈ AED 142 A DAY UNTIL PAYDAY ***");
    expect(perDayNote(-500, "AED")).toBe("*** ≈ AED 0 A DAY UNTIL PAYDAY ***");
  });

  it("names the reminders the budget will send", () => {
    const payday = { kind: "day" as const, day: 25 };
    expect(remindersLine(4, true, payday)).toBe(
      "4 bill reminders, plus a payday reminder on the 25th. Nothing is paid for you.",
    );
    expect(remindersLine(1, false, payday)).toBe("1 bill reminder. Nothing is paid for you.");
    expect(remindersLine(0, true, { kind: "last_workday" })).toBe(
      "A payday reminder on your last workday. Nothing is paid for you.",
    );
    expect(remindersLine(0, false, payday)).toBeNull();
  });
});
