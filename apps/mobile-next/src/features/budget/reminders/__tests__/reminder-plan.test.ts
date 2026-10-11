import { EMPTY_REMINDER_PREFS, setMuted, snoozeUntil, type ReminderPrefs } from "../reminder-prefs";
import {
  billsMessage,
  planBillReminders,
  planPaydayReminders,
  type ReminderBill,
} from "../reminder-plan";

const money = (minor: number) =>
  `AED ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const bill = (ruleId: string, scheduledDate: string, amountMinor = 185_000): ReminderBill => ({
  ruleId,
  scheduledDate,
  name: ruleId,
  amountMinor,
});

const plan = (bills: ReminderBill[], prefs: ReminderPrefs = EMPTY_REMINDER_PREFS) =>
  planBillReminders({ bills, prefs, today: "2026-10-11", horizonDays: 13, money });

describe("billsMessage", () => {
  it("names a single bill with its amount", () => {
    expect(billsMessage([bill("Car loan", "2026-10-11")], "2026-10-11", money).body).toBe(
      "Car loan AED 1,850.00 due today",
    );
  });

  it("counts several bills", () => {
    const bills = [bill("a", "2026-10-11"), bill("b", "2026-10-11"), bill("c", "2026-10-11")];
    expect(billsMessage(bills, "2026-10-11", money).body).toBe("3 bills due today");
  });

  it("says overdue when every bill is late", () => {
    expect(
      billsMessage([bill("a", "2026-10-09"), bill("b", "2026-10-10")], "2026-10-11", money).body,
    ).toBe("2 bills overdue");
  });
});

describe("planBillReminders", () => {
  it("batches a day's bills into one notification", () => {
    const planned = plan([
      bill("a", "2026-10-12"),
      bill("b", "2026-10-12"),
      bill("c", "2026-10-14"),
    ]);
    expect(planned.map((reminder) => [reminder.day, reminder.body])).toEqual([
      ["2026-10-12", "2 bills due today"],
      ["2026-10-14", "c AED 1,850.00 due today"],
    ]);
  });

  it("skips muted bills", () => {
    const prefs = setMuted(EMPTY_REMINDER_PREFS, "a", true);
    expect(plan([bill("a", "2026-10-12"), bill("b", "2026-10-12")], prefs)[0]?.body).toBe(
      "b AED 1,850.00 due today",
    );
  });

  it("moves a snoozed bill to the day it returns", () => {
    const prefs = snoozeUntil(EMPTY_REMINDER_PREFS, "a", "2026-10-11", "2026-10-12");
    expect(plan([bill("a", "2026-10-11")], prefs).map((reminder) => reminder.day)).toEqual([
      "2026-10-12",
    ]);
  });

  it("sends nothing for overdue bills that are not snoozed, or for days past the horizon", () => {
    expect(plan([bill("late", "2026-10-02"), bill("far", "2026-11-30")])).toEqual([]);
  });
});

describe("planPaydayReminders", () => {
  it("lists the upcoming paydays under the current rule", () => {
    const planned = planPaydayReminders({
      rule: { kind: "day", day: 25 },
      currentPeriodStart: "2026-09-25",
      today: "2026-10-11",
      count: 2,
    });
    expect(planned.map((reminder) => reminder.day)).toEqual(["2026-10-25", "2026-11-25"]);
  });

  it("includes today when today is payday", () => {
    const planned = planPaydayReminders({
      rule: { kind: "day", day: 25 },
      currentPeriodStart: "2026-10-25",
      today: "2026-10-25",
      count: 2,
    });
    expect(planned.map((reminder) => reminder.day)).toEqual(["2026-10-25", "2026-11-25"]);
  });
});
