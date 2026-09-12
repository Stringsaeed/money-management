import { describe, expect, it } from "@jest/globals";

import { FREQUENCY_LABELS } from "./presets";

describe("FREQUENCY_LABELS", () => {
  it("locks day through year recurrence unit labels", () => {
    expect(FREQUENCY_LABELS).toEqual({
      day: "days",
      week: "weeks",
      month: "months",
      year: "years",
    });
  });
});
