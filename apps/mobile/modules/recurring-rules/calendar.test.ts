import { describe, expect, it } from "@jest/globals";

import { nextScheduledDateOnOrAfter, scheduledDatesThrough } from "@trove/domain/calendar";

describe("Recurring Rule calendar", () => {
  it("keeps the explicit month-end anchor instead of drifting after a clamp", () => {
    expect(
      scheduledDatesThrough(
        {
          startDate: "2026-01-31",
          frequency: "month",
          intervalCount: 1,
          endDate: "2026-04-30",
          endCount: null,
        },
        "2026-05-31",
      ),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("treats start, end date, and end count as inclusive", () => {
    expect(
      scheduledDatesThrough(
        {
          startDate: "2026-04-15",
          frequency: "week",
          intervalCount: 2,
          endDate: "2026-05-13",
          endCount: 3,
        },
        "2026-05-13",
      ),
    ).toEqual(["2026-04-15", "2026-04-29", "2026-05-13"]);
  });

  it("finds the next anchored date without replaying the whole calendar", () => {
    expect(
      nextScheduledDateOnOrAfter(
        {
          startDate: "2024-02-29",
          frequency: "year",
          intervalCount: 1,
          endDate: null,
          endCount: null,
        },
        "2027-03-01",
      ),
    ).toBe("2028-02-29");
  });

  it("rejects a non-positive interval", () => {
    expect(() =>
      scheduledDatesThrough(
        {
          startDate: "2026-01-01",
          frequency: "day",
          intervalCount: 0,
          endDate: null,
          endCount: null,
        },
        "2026-01-01",
      ),
    ).toThrow("positive integer");
  });
});
