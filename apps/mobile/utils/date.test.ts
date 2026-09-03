import { describe, expect, it, jest } from "@jest/globals";

import {
  addMonths,
  clampDay,
  formatDayHeader,
  formatMonth,
  monthBounds,
  monthsBetween,
  nextBudgetPeriod,
  nowIso,
  parseDate,
  today,
  toDateString,
} from "@/utils/date";

describe("date utils", () => {
  it("parses and formats local date strings", () => {
    const parsed = parseDate("2026-03-28");

    expect(toDateString(parsed)).toBe("2026-03-28");
  });

  it("formats day and month display values", () => {
    expect(formatDayHeader("2026-03-28")).toContain("Mar");
    expect(formatMonth(2026, 3)).toBe("March 2026");
  });

  it("returns month bounds", () => {
    expect(monthBounds(2026, 2)).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("adds months across year edges", () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("clamps leap-year and short-month days", () => {
    expect(clampDay(2024, 2, 31)).toBe(29);
    expect(clampDay(2026, 4, 31)).toBe(30);
  });

  it("returns months newest-first within a range", () => {
    expect(monthsBetween("2026-01-01", "2026-03-28")).toEqual([
      { year: 2026, month: 3 },
      { year: 2026, month: 2 },
      { year: 2026, month: 1 },
    ]);
  });

  it("returns an empty array for missing or inverted ranges", () => {
    expect(monthsBetween(null, "2026-03-28")).toEqual([]);
    expect(monthsBetween("2026-04-01", "2026-03-01")).toEqual([]);
  });

  it("returns the current local date and ISO timestamp", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-19T08:00:00.000Z"));

    expect(today()).toBe(toDateString(new Date("2026-08-19T08:00:00.000Z")));
    expect(nowIso()).toBe("2026-08-19T08:00:00.000Z");

    jest.useRealTimers();
  });

  it("returns the next budget period", () => {
    expect(nextBudgetPeriod("2026-08")).toBe("2026-09");
    expect(nextBudgetPeriod("2026-12")).toBe("2027-01");
  });
});
