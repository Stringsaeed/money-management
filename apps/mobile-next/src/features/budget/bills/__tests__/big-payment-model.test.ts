import { checkBigPayment, checkPayment, nextDueDate, savingPreview } from "../big-payment-model";

const RULE = { kind: "day", day: 25 } as const;
const CURRENT_START = "2026-10-25";

describe("savingPreview", () => {
  it("spreads what is left over the paydays up to the due date, rounding up", () => {
    // Paydays on 25 Nov, 25 Dec and 25 Jan.
    expect(
      savingPreview({
        targetMinor: 1_000_000,
        setAsideMinor: 100_000,
        dueDate: "2027-01-25",
        rule: RULE,
        currentPeriodStart: CURRENT_START,
      }),
    ).toEqual({ perPaydayMinor: 300_000, paydaysLeft: 3, shortBeforePaydayMinor: null });
    expect(
      savingPreview({
        targetMinor: 1_000_000,
        setAsideMinor: 0,
        dueDate: "2027-01-25",
        rule: RULE,
        currentPeriodStart: CURRENT_START,
      }).perPaydayMinor,
    ).toBe(333_334);
  });

  it("warns when the due date falls before the next payday", () => {
    expect(
      savingPreview({
        targetMinor: 900_000,
        setAsideMinor: 200_000,
        dueDate: "2026-11-10",
        rule: RULE,
        currentPeriodStart: CURRENT_START,
      }),
    ).toEqual({ perPaydayMinor: 700_000, paydaysLeft: 1, shortBeforePaydayMinor: 700_000 });
  });

  it("has no warning when it is already fully set aside", () => {
    expect(
      savingPreview({
        targetMinor: 900_000,
        setAsideMinor: 900_000,
        dueDate: "2026-11-10",
        rule: RULE,
        currentPeriodStart: CURRENT_START,
      }),
    ).toEqual({ perPaydayMinor: 0, paydaysLeft: 1, shortBeforePaydayMinor: null });
  });
});

describe("nextDueDate", () => {
  it("moves a repeating payment on from its old due date", () => {
    expect(nextDueDate("2026-11-30", "every_3_months")).toBe("2027-02-28");
    expect(nextDueDate("2026-11-15", "every_6_months")).toBe("2027-05-15");
    expect(nextDueDate("2026-11-15", "yearly")).toBe("2027-11-15");
  });

  it("is null for a one-off", () => {
    expect(nextDueDate("2026-11-15", "once")).toBeNull();
    expect(nextDueDate("2026-11-15", null)).toBeNull();
  });
});

describe("checkBigPayment", () => {
  const context = { currency: "AED", today: "2026-10-11", unassignedMinor: 500_000 };
  const draft = {
    name: " Rent cheque ",
    amountText: "12000",
    setAsideText: "2500",
    dueDate: "2027-01-01",
    repeat: "every_3_months",
  } as const;

  it("builds a Saving-for envelope with the set aside as its plan", () => {
    expect(checkBigPayment(draft, context)).toEqual({
      ok: true,
      targetMinor: 1_200_000,
      setAsideMinor: 250_000,
      input: {
        name: "Rent cheque",
        group: "saving",
        newCategory: { name: "Rent cheque" },
        plannedMinor: 250_000,
        targetMinor: 1_200_000,
        dueDate: "2027-01-01",
        repeat: "every_3_months",
      },
    });
  });

  it("treats a blank set aside as zero", () => {
    const result = checkBigPayment({ ...draft, setAsideText: "" }, context);
    expect(result.ok && result.input.plannedMinor).toBe(0);
  });

  it("stays quiet while unfinished and explains real mistakes", () => {
    expect(checkBigPayment({ ...draft, name: "" }, context)).toEqual({ ok: false, message: "" });
    expect(checkBigPayment({ ...draft, setAsideText: "13000" }, context)).toMatchObject({
      ok: false,
      message: expect.stringContaining("more than the amount"),
    });
    expect(checkBigPayment({ ...draft, dueDate: "2026-10-10" }, context)).toMatchObject({
      ok: false,
      message: expect.stringContaining("due date"),
    });
  });

  it("blocks setting aside more than Not planned yet has", () => {
    expect(checkBigPayment({ ...draft, setAsideText: "6000" }, context)).toMatchObject({
      ok: false,
      message: expect.stringContaining("Not planned yet"),
    });
  });
});

describe("checkPayment", () => {
  const period = { currency: "AED", start: "2026-10-25", today: "2026-11-02" };
  const draft = { amountText: "12000", accountId: "bank", date: "2026-11-02" };

  it("pays today or earlier in this period", () => {
    expect(checkPayment(draft, period)).toEqual({
      ok: true,
      input: { amountMinor: 1_200_000, accountId: "bank", date: "2026-11-02" },
    });
    expect(checkPayment({ ...draft, date: "2026-10-25" }, period).ok).toBe(true);
  });

  it("refuses a date before the period or after today", () => {
    const refused = { ok: false, message: "Pick a day in this budget month, up to today." };
    expect(checkPayment({ ...draft, date: "2026-10-24" }, period)).toEqual(refused);
    expect(checkPayment({ ...draft, date: "2026-11-03" }, period)).toEqual(refused);
  });
});
