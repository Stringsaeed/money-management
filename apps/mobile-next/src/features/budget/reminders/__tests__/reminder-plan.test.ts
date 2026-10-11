import { EMPTY_REMINDER_PREFS, setMuted, snoozeUntil, type ReminderPrefs } from "../reminder-prefs";
import {
  billsMessage,
  planBillReminders,
  planLedgerReminders,
  planPaydayReminders,
  type ReminderBill,
} from "../reminder-plan";

const money = (minor: number, currency: string) =>
  `${currency} ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const bill = (
  ruleId: string,
  scheduledDate: string,
  amountMinor = 185_000,
  currency = "AED",
): ReminderBill => ({
  ruleId,
  currency,
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
      currency: "AED",
      rule: { kind: "day", day: 25 },
      currentPeriodStart: "2026-09-25",
      today: "2026-10-11",
      count: 2,
    });
    expect(planned.map((reminder) => reminder.day)).toEqual(["2026-10-25", "2026-11-25"]);
  });

  it("includes today when today is payday and the salary is not logged yet", () => {
    const planned = planPaydayReminders({
      currency: "AED",
      rule: { kind: "day", day: 25 },
      currentPeriodStart: "2026-10-25",
      today: "2026-10-25",
      count: 2,
      pending: true,
    });
    expect(planned.map((reminder) => reminder.day)).toEqual(["2026-10-25", "2026-11-25"]);
  });

  it("drops today's payday reminder once the salary is logged", () => {
    const planned = planPaydayReminders({
      currency: "AED",
      rule: { kind: "day", day: 25 },
      currentPeriodStart: "2026-10-25",
      today: "2026-10-25",
      count: 2,
      pending: false,
    });
    expect(planned.map((reminder) => reminder.day)).toEqual(["2026-11-25", "2026-12-25"]);
  });

  const late = {
    currency: "AED",
    rule: { kind: "day", day: 25 } as const,
    currentPeriodStart: "2026-10-25",
    today: "2026-10-26",
    count: 2,
  };

  it("brings the reminder back tomorrow after Not yet while the salary is unlogged", () => {
    const planned = planPaydayReminders({ ...late, pending: true, snoozedOn: "2026-10-26" });
    expect(planned.map((reminder) => reminder.day)).toEqual([
      "2026-10-27",
      "2026-11-25",
      "2026-12-25",
    ]);
  });

  it("keeps one reminder per day and drops the retry once the salary is logged", () => {
    expect(planPaydayReminders({ ...late, pending: false, snoozedOn: "2026-10-26" })).toHaveLength(
      2,
    );
    const twice = planPaydayReminders({
      ...late,
      today: "2026-11-24",
      currentPeriodStart: "2026-10-25",
      pending: true,
      snoozedOn: "2026-11-24",
    });
    expect(new Set(twice.map((reminder) => reminder.day)).size).toBe(twice.length);
  });
});

describe("planLedgerReminders", () => {
  const payday = {
    rule: { kind: "day", day: 25 } as const,
    currentPeriodStart: "2026-09-25",
    count: 1,
  };
  const ledger = (sources: Parameters<typeof planLedgerReminders>[0]["sources"]) =>
    planLedgerReminders({
      sources,
      prefs: EMPTY_REMINDER_PREFS,
      today: "2026-10-11",
      horizonDays: 13,
      money,
    });

  it("sends one bills notification a day across budgets", () => {
    const planned = ledger([
      { currency: "AED", bills: [bill("rent", "2026-10-12")], payday: { ...payday, count: 0 } },
      {
        currency: "USD",
        bills: [bill("saas", "2026-10-12", 4_900, "USD"), bill("vps", "2026-10-15", 900, "USD")],
        payday: { ...payday, count: 0 },
      },
    ]);
    expect(planned.map((reminder) => [reminder.kind, reminder.day, reminder.body])).toEqual([
      ["bills", "2026-10-12", "2 bills due today"],
      ["bills", "2026-10-15", "vps USD 9.00 due today"],
    ]);
  });

  it("opens the budget of the first bill, and a lone bill uses its own currency", () => {
    const planned = ledger([
      { currency: "AED", bills: [], payday: { ...payday, count: 0 } },
      {
        currency: "USD",
        bills: [bill("saas", "2026-10-12", 4_900, "USD")],
        payday: { ...payday, count: 0 },
      },
    ]);
    expect(planned).toEqual([
      expect.objectContaining({ currency: "USD", body: "saas USD 49.00 due today" }),
    ]);
  });

  it("keeps a payday reminder per budget", () => {
    const planned = ledger([
      { currency: "AED", bills: [], payday },
      { currency: "USD", bills: [], payday },
    ]);
    expect(planned.map((reminder) => [reminder.kind, reminder.currency, reminder.day])).toEqual([
      ["payday", "AED", "2026-10-25"],
      ["payday", "USD", "2026-10-25"],
    ]);
  });
});
