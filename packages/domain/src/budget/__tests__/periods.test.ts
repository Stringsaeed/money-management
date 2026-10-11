import { describe, expect, it } from "vitest";

import {
  budgetPeriods,
  daysLeftInclusive,
  nextPeriodStart,
  periodContaining,
  periodStartForMonth,
  type PaydayChange,
  type PaydayRule,
} from "../periods";

const day25: PaydayRule = { kind: "day", day: 25 };
const day28: PaydayRule = { kind: "day", day: 28 };
const lastWorkday: PaydayRule = { kind: "last_workday" };

describe("periodContaining", () => {
  it("starts a period on the payday itself", () => {
    expect(periodContaining(day25, "2026-01-25")).toEqual({
      start: "2026-01-25",
      end: "2026-02-24",
    });
  });

  it("keeps the day before payday in the previous period", () => {
    expect(periodContaining(day25, "2026-01-24")).toEqual({
      start: "2025-12-25",
      end: "2026-01-24",
    });
  });

  it("handles day 28 in February", () => {
    expect(periodContaining(day28, "2026-02-27")).toEqual({
      start: "2026-01-28",
      end: "2026-02-27",
    });
    expect(periodContaining(day28, "2026-02-28")).toEqual({
      start: "2026-02-28",
      end: "2026-03-27",
    });
  });

  it("uses the last Monday-Friday of the month for last_workday", () => {
    // 2026-07-31 is a Friday: payday is the month end itself.
    expect(periodStartForMonth(lastWorkday, "2026-07")).toBe("2026-07-31");
    expect(periodContaining(lastWorkday, "2026-07-31")).toEqual({
      start: "2026-07-31",
      end: "2026-08-30",
    });
    expect(periodContaining(lastWorkday, "2026-07-30")).toEqual({
      start: "2026-06-30",
      end: "2026-07-30",
    });
    // 2026-10-31 is a Saturday and 2026-05-31 a Sunday: payday moves back to Friday.
    expect(periodStartForMonth(lastWorkday, "2026-10")).toBe("2026-10-30");
    expect(periodStartForMonth(lastWorkday, "2026-05")).toBe("2026-05-29");
    expect(periodContaining(lastWorkday, "2026-10-31")).toEqual({
      start: "2026-10-30",
      end: "2026-11-29",
    });
  });

  it("rejects payday days that are not representable", () => {
    expect(() => periodStartForMonth({ kind: "day", day: 29 }, "2026-01")).toThrow();
    expect(() => periodStartForMonth({ kind: "day", day: 0 }, "2026-01")).toThrow();
  });
});

describe("nextPeriodStart", () => {
  it("finds the next start after the current one", () => {
    expect(nextPeriodStart(day25, "2026-01-25")).toBe("2026-02-25");
    expect(nextPeriodStart(lastWorkday, "2026-09-30")).toBe("2026-10-30");
  });
});

describe("budgetPeriods", () => {
  const activation = { effectiveFrom: "2026-01-25", rule: day25 };

  it("walks forward from activation through the period containing the date", () => {
    expect(budgetPeriods([activation], "2026-01-25", "2026-03-10")).toEqual([
      { start: "2026-01-25", end: "2026-02-24" },
      { start: "2026-02-25", end: "2026-03-24" },
    ]);
  });

  it("applies a start-day change from the current period and leaves earlier periods alone", () => {
    const shorter: PaydayChange[] = [
      activation,
      { effectiveFrom: "2026-02-25", rule: { kind: "day", day: 1 } },
    ];
    expect(budgetPeriods(shorter, "2026-01-25", "2026-03-10")).toEqual([
      { start: "2026-01-25", end: "2026-02-24" },
      { start: "2026-02-25", end: "2026-02-28" },
      { start: "2026-03-01", end: "2026-03-31" },
    ]);

    const longer: PaydayChange[] = [
      activation,
      { effectiveFrom: "2026-02-25", rule: { kind: "day", day: 10 } },
    ];
    expect(budgetPeriods(longer, "2026-01-25", "2026-03-05")).toEqual([
      { start: "2026-01-25", end: "2026-02-24" },
      { start: "2026-02-25", end: "2026-03-09" },
    ]);
  });

  it("refuses dates before activation", () => {
    expect(() => budgetPeriods([activation], "2026-01-25", "2026-01-24")).toThrow();
  });
});

describe("daysLeftInclusive", () => {
  it("counts today and the last day", () => {
    expect(daysLeftInclusive("2026-02-24", "2026-02-24")).toBe(1);
    expect(daysLeftInclusive("2026-02-10", "2026-02-24")).toBe(15);
  });
});
