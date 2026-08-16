import { createRecurringPayment } from "@/tests/test-utils/factories";
import { intlFormat } from "date-fns";
import { parseDate } from "@/utils/date";
import {
  formatRecurrence,
  formatUpcomingOccurrence,
  getNextOccurrence,
  getPendingOccurrences,
  getUpcomingRecurringPayments,
} from "@/utils/recurring";

describe("getPendingOccurrences", () => {
  it("returns no occurrences for inactive rules", () => {
    expect(
      getPendingOccurrences(createRecurringPayment({ isActive: false }), "2026-03-28"),
    ).toEqual([]);
  });

  it("collects daily occurrences between the start date and today", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          intervalCount: 1,
          startDate: "2026-03-26",
          lastGeneratedDate: null,
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-26", "2026-03-27", "2026-03-28"]);
  });

  it("starts the day after the last generated date", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-01",
          lastGeneratedDate: "2026-03-27",
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-28"]);
  });

  it("anchors weekly occurrences on the start date", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "week", intervalCount: 1, startDate: "2026-03-02" }),
        "2026-03-30",
      ),
    ).toEqual(["2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23", "2026-03-30"]);
  });

  it("supports bi-weekly cadence (every 2 weeks)", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "week", intervalCount: 2, startDate: "2026-03-02" }),
        "2026-04-13",
      ),
    ).toEqual(["2026-03-02", "2026-03-16", "2026-03-30", "2026-04-13"]);
  });

  it("collects monthly occurrences and clamps month-end", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "month", intervalCount: 1, startDate: "2026-01-31" }),
        "2026-03-31",
      ),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });

  it("supports custom every-N-months cadence", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "month", intervalCount: 3, startDate: "2026-01-15" }),
        "2026-07-20",
      ),
    ).toEqual(["2026-01-15", "2026-04-15", "2026-07-15"]);
  });

  it("collects yearly occurrences and clamps leap-year dates", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "year", intervalCount: 1, startDate: "2024-02-29" }),
        "2026-03-01",
      ),
    ).toEqual(["2024-02-29", "2025-02-28", "2026-02-28"]);
  });

  it("does not generate beyond the end date", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-20",
          endDate: "2026-03-22",
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-20", "2026-03-21", "2026-03-22"]);
  });

  it("stops after the requested number of occurrences (endCount)", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "day", startDate: "2026-03-20", endCount: 3 }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-20", "2026-03-21", "2026-03-22"]);
  });

  it("uses the earlier of endDate and endCount", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-20",
          endDate: "2026-03-25",
          endCount: 3, // 3rd occurrence = 2026-03-22, earlier than endDate
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-20", "2026-03-21", "2026-03-22"]);

    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-20",
          endDate: "2026-03-21", // earlier than the 5th occurrence
          endCount: 5,
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-20", "2026-03-21"]);
  });

  it("ignores a non-positive endCount", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({ frequency: "day", startDate: "2026-03-26", endCount: 0 }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-26", "2026-03-27", "2026-03-28"]);
  });

  it("caps at today when the end date is in the future", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-26",
          endDate: "2026-12-31",
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-26", "2026-03-27", "2026-03-28"]);
  });

  it("returns nothing when the last generated date is already at the ceiling", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-20",
          lastGeneratedDate: "2026-03-28",
        }),
        "2026-03-28",
      ),
    ).toEqual([]);
  });

  it("never generates before the start date", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-03-26",
          lastGeneratedDate: "2026-03-20",
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-26", "2026-03-27", "2026-03-28"]);
  });

  it("jumps to the first occurrence within the current period", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          frequency: "month",
          startDate: "2026-03-01",
          lastGeneratedDate: "2026-03-14",
        }),
        "2026-05-05",
      ),
    ).toEqual(["2026-04-01", "2026-05-01"]);
  });
});

describe("getNextOccurrence", () => {
  it.each([
    ["day", { startDate: "2024-01-01" }, "2026-03-29"],
    ["week", { startDate: "2026-03-02" }, "2026-03-30"],
    ["month", { startDate: "2026-01-31" }, "2026-03-31"],
    ["year", { startDate: "2024-01-01" }, "2027-01-01"],
  ] as const)("finds the next %s occurrence", (frequency, overrides, expected) => {
    expect(
      getNextOccurrence(
        createRecurringPayment({ frequency, intervalCount: 1, ...overrides }),
        "2026-03-28",
      ),
    ).toBe(expected);
  });

  it("excludes paused and ended rules", () => {
    expect(getNextOccurrence(createRecurringPayment({ isActive: false }), "2026-03-28")).toBeNull();
    expect(
      getNextOccurrence(
        createRecurringPayment({
          frequency: "day",
          startDate: "2026-01-01",
          endDate: "2026-03-28",
        }),
        "2026-03-28",
      ),
    ).toBeNull();
  });

  it("uses the generated date and future start date as effective floors", () => {
    expect(
      getNextOccurrence(
        createRecurringPayment({
          frequency: "day",
          startDate: "2024-01-01",
          lastGeneratedDate: "2026-04-02",
        }),
        "2026-03-28",
      ),
    ).toBe("2026-04-03");
    expect(
      getNextOccurrence(
        createRecurringPayment({ frequency: "week", startDate: "2026-04-06" }),
        "2026-03-28",
      ),
    ).toBe("2026-04-06");
  });

  it("respects an end date that falls around the next scheduled occurrence", () => {
    const payment = createRecurringPayment({ frequency: "month", startDate: "2026-01-05" });

    expect(getNextOccurrence({ ...payment, endDate: "2026-04-05" }, "2026-03-28")).toBe(
      "2026-04-05",
    );
    expect(getNextOccurrence({ ...payment, endDate: "2026-04-02" }, "2026-03-28")).toBeNull();
  });
});

describe("getUpcomingRecurringPayments", () => {
  it("sorts upcoming rules and applies the requested limit", () => {
    const payments = [
      createRecurringPayment({ id: "later", frequency: "month", startDate: "2026-01-10" }),
      createRecurringPayment({ id: "tomorrow", frequency: "day", startDate: "2024-01-01" }),
      createRecurringPayment({ id: "paused", isActive: false }),
    ];
    const results = getUpcomingRecurringPayments(payments, "2026-03-28", 1);

    expect(results).toHaveLength(1);
    expect(results[0]?.payment.id).toBe("tomorrow");
    expect(results[0]?.occurrenceDate).toBe("2026-03-29");

    expect(getUpcomingRecurringPayments(payments, "2026-03-28")).toHaveLength(2);
  });
});

describe("formatUpcomingOccurrence", () => {
  it("formats tomorrow and later dates", () => {
    expect(formatUpcomingOccurrence("2026-03-29", "2026-03-28")).toBe("Tomorrow");
    expect(formatUpcomingOccurrence("2026-04-05", "2026-03-28")).toBe(
      intlFormat(parseDate("2026-04-05"), { weekday: "short", month: "short", day: "numeric" }),
    );
  });
});

describe("formatRecurrence", () => {
  it("labels presets and custom cadences", () => {
    expect(formatRecurrence({ frequency: "day", intervalCount: 1 })).toBe("Daily");
    expect(formatRecurrence({ frequency: "week", intervalCount: 1 })).toBe("Weekly");
    expect(formatRecurrence({ frequency: "month", intervalCount: 1 })).toBe("Monthly");
    expect(formatRecurrence({ frequency: "year", intervalCount: 1 })).toBe("Yearly");
    expect(formatRecurrence({ frequency: "week", intervalCount: 2 })).toBe("Every 2 weeks");
    expect(formatRecurrence({ frequency: "month", intervalCount: 3 })).toBe("Every 3 months");
  });
});
