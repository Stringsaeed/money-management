import { describe, expect, it } from "@jest/globals";

import { REPEAT_PRESETS } from "./presets";

describe("REPEAT_PRESETS", () => {
  it("locks daily through yearly recurrence preset vocabulary", () => {
    expect(REPEAT_PRESETS).toEqual([
      { key: "daily", label: "Daily", frequency: "day", intervalCount: 1 },
      { key: "weekly", label: "Weekly", frequency: "week", intervalCount: 1 },
      { key: "biweekly", label: "Every 2 weeks", frequency: "week", intervalCount: 2 },
      { key: "monthly", label: "Monthly", frequency: "month", intervalCount: 1 },
      { key: "bimonthly", label: "Every 2 months", frequency: "month", intervalCount: 2 },
      { key: "yearly", label: "Yearly", frequency: "year", intervalCount: 1 },
    ]);
  });
});
