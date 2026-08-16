import { createRecurringPayment } from "@/tests/test-utils/factories";
import { intlFormat } from "date-fns";
import { parseDate } from "@/utils/date";
import {
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
          interval: "daily",
          startDate: "2026-03-26",
          lastGeneratedDate: null,
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-26", "2026-03-27", "2026-03-28"]);
  });

  it("starts after the last generated date", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "daily",
          startDate: "2026-03-01",
          lastGeneratedDate: "2026-03-27",
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-28"]);
  });

  it("collects weekly occurrences by weekday", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "weekly",
          startDate: "2026-03-01",
          dayOfWeek: 1,
        }),
        "2026-03-31",
      ),
    ).toEqual(["2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23", "2026-03-30"]);
  });

  it("collects monthly occurrences and clamps invalid month days", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "monthly",
          startDate: "2026-01-31",
          dayOfMonth: 31,
        }),
        "2026-03-31",
      ),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });

  it("collects yearly occurrences and clamps leap-year dates", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "yearly",
          startDate: "2024-02-29",
          monthOfYear: 2,
          dayOfMonth: 29,
        }),
        "2026-03-01",
      ),
    ).toEqual(["2024-02-29", "2025-02-28", "2026-02-28"]);
  });

  it("does not generate beyond the end date", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "daily",
          startDate: "2026-03-20",
          endDate: "2026-03-22",
        }),
        "2026-03-28",
      ),
    ).toEqual(["2026-03-20", "2026-03-21", "2026-03-22"]);
  });

  it("returns no occurrences when the last generated date is already beyond the ceiling", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "daily",
          startDate: "2026-03-20",
          lastGeneratedDate: "2026-03-28",
        }),
        "2026-03-28",
      ),
    ).toEqual([]);
  });

  it("uses default weekly, monthly, and yearly values when rule fields are absent", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "weekly",
          startDate: "2026-03-01",
          dayOfWeek: null,
        }),
        "2026-03-09",
      ),
    ).toEqual(["2026-03-02", "2026-03-09"]);

    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "monthly",
          startDate: "2026-03-01",
          dayOfMonth: null,
        }),
        "2026-04-05",
      ),
    ).toEqual(["2026-03-01", "2026-04-01"]);

    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "yearly",
          startDate: "2026-01-01",
          monthOfYear: null,
          dayOfMonth: null,
        }),
        "2027-01-02",
      ),
    ).toEqual(["2026-01-01", "2027-01-01"]);
  });

  it("skips monthly and yearly candidates that fall before the effective floor", () => {
    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "monthly",
          startDate: "2026-03-20",
          dayOfMonth: 5,
        }),
        "2026-04-10",
      ),
    ).toEqual(["2026-04-05"]);

    expect(
      getPendingOccurrences(
        createRecurringPayment({
          interval: "yearly",
          startDate: "2026-03-20",
          monthOfYear: 2,
          dayOfMonth: 1,
        }),
        "2027-03-25",
      ),
    ).toEqual(["2027-02-01"]);
  });
});

describe("upcoming recurring payments", () => {
  it.each([
    ["daily", {}, "2026-03-29"],
    ["weekly", { dayOfWeek: 1 }, "2026-03-30"],
    ["monthly", { dayOfMonth: 31 }, "2026-03-31"],
    ["yearly", { monthOfYear: 2, dayOfMonth: 29 }, "2027-02-28"],
  ] as const)("finds the next %s occurrence", (interval, overrides, expected) => {
    expect(
      getNextOccurrence(
        createRecurringPayment({ interval, startDate: "2024-01-01", ...overrides }),
        "2026-03-28",
      ),
    ).toBe(expected);
  });

  it("excludes paused and ended rules", () => {
    expect(getNextOccurrence(createRecurringPayment({ isActive: false }), "2026-03-28")).toBeNull();
    expect(
      getNextOccurrence(
        createRecurringPayment({ interval: "daily", endDate: "2026-03-28" }),
        "2026-03-28",
      ),
    ).toBeNull();
  });

  it("uses the generated date and future start date as effective floors", () => {
    expect(
      getNextOccurrence(
        createRecurringPayment({
          interval: "daily",
          lastGeneratedDate: "2026-04-02",
        }),
        "2026-03-28",
      ),
    ).toBe("2026-04-03");
    expect(
      getNextOccurrence(
        createRecurringPayment({
          interval: "weekly",
          startDate: "2026-04-01",
          dayOfWeek: null,
        }),
        "2026-03-28",
      ),
    ).toBe("2026-04-06");
  });

  it("uses default monthly and yearly schedule fields", () => {
    expect(
      getNextOccurrence(
        createRecurringPayment({ interval: "monthly", dayOfMonth: null }),
        "2026-03-28",
      ),
    ).toBe("2026-04-01");
    expect(
      getNextOccurrence(
        createRecurringPayment({
          interval: "yearly",
          monthOfYear: null,
          dayOfMonth: null,
          startDate: "2024-01-01",
        }),
        "2025-12-30",
      ),
    ).toBe("2026-01-01");
    expect(
      getNextOccurrence(
        createRecurringPayment({
          interval: "yearly",
          monthOfYear: 12,
          dayOfMonth: 31,
        }),
        "2026-03-28",
      ),
    ).toBe("2026-12-31");
  });

  it("respects an end date that falls around the next scheduled occurrence", () => {
    const payment = createRecurringPayment({ interval: "monthly", dayOfMonth: 5 });

    expect(getNextOccurrence({ ...payment, endDate: "2026-04-05" }, "2026-03-28")).toBe(
      "2026-04-05",
    );
    expect(getNextOccurrence({ ...payment, endDate: "2026-04-02" }, "2026-03-28")).toBeNull();
  });

  it("sorts upcoming rules and applies the requested limit", () => {
    const payments = [
      createRecurringPayment({ id: "later", interval: "monthly", dayOfMonth: 10 }),
      createRecurringPayment({ id: "tomorrow", interval: "daily" }),
      createRecurringPayment({ id: "paused", isActive: false }),
    ];
    const results = getUpcomingRecurringPayments(payments, "2026-03-28", 1);

    expect(results).toHaveLength(1);
    expect(results[0]?.payment.id).toBe("tomorrow");
    expect(results[0]?.occurrenceDate).toBe("2026-03-29");

    expect(getUpcomingRecurringPayments(payments, "2026-03-28")).toHaveLength(2);
  });

  it("formats tomorrow and later dates", () => {
    expect(formatUpcomingOccurrence("2026-03-29", "2026-03-28")).toBe("Tomorrow");
    expect(formatUpcomingOccurrence("2026-04-05", "2026-03-28")).toBe(
      intlFormat(parseDate("2026-04-05"), {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });
});
