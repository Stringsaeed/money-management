import { describe, expect, it } from "vitest";

import { dateAfter } from "@trove/domain/calendar";

describe("dateAfter", () => {
  it("returns the next calendar day for a mid-month date", () => {
    expect(dateAfter("2026-09-12")).toBe("2026-09-13");
  });

  it("rolls across month ends", () => {
    expect(dateAfter("2026-09-30")).toBe("2026-10-01");
    expect(dateAfter("2026-02-28")).toBe("2026-03-01");
  });

  it("rolls across year ends", () => {
    expect(dateAfter("2025-12-31")).toBe("2026-01-01");
  });
});
