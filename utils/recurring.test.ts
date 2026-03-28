import { createRecurringPayment } from "@/tests/test-utils/factories";
import { getPendingOccurrences } from "@/utils/recurring";

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
