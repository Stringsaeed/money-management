import { describe, expect, it } from "@jest/globals";

import { localDateInTimeZone } from "../clock";

describe("Recurring Rules clock", () => {
  it("resolves the Rule-local date across a UTC day boundary", () => {
    const instant = new Date("2026-01-01T01:00:00.000Z");

    expect(localDateInTimeZone(instant, "Asia/Dubai")).toBe("2026-01-01");
    expect(localDateInTimeZone(instant, "America/Los_Angeles")).toBe("2025-12-31");
  });
});
