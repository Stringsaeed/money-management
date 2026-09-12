import { describe, expect, it } from "@jest/globals";

import { localDateInTimeZone } from "./clock";

describe("localDateInTimeZone", () => {
  it("resolves the Rule-local date across a UTC day boundary", () => {
    const instant = new Date("2026-01-01T01:00:00.000Z");

    expect(localDateInTimeZone(instant, "Asia/Dubai")).toBe("2026-01-01");
    expect(localDateInTimeZone(instant, "America/Los_Angeles")).toBe("2025-12-31");
  });

  it("formats YYYY-MM-DD in UTC and Tokyo for a fixed noon instant", () => {
    const instant = new Date("2026-09-12T12:00:00.000Z");

    expect(localDateInTimeZone(instant, "UTC")).toBe("2026-09-12");
    expect(localDateInTimeZone(instant, "Asia/Tokyo")).toBe("2026-09-12");
    expect(localDateInTimeZone(instant, "Pacific/Honolulu")).toBe("2026-09-12");
  });

  it("keeps the previous local calendar day when the instant is still evening in US Pacific", () => {
    const instant = new Date("2026-09-13T06:30:00.000Z");

    expect(localDateInTimeZone(instant, "UTC")).toBe("2026-09-13");
    expect(localDateInTimeZone(instant, "America/Los_Angeles")).toBe("2026-09-12");
  });
});
