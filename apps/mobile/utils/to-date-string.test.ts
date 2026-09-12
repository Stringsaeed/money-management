import { describe, expect, it } from "@jest/globals";

import { toDateString } from "./date";

describe("toDateString", () => {
  it("formats a local Date as YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 8, 12))).toBe("2026-09-12");
    expect(toDateString(new Date(2024, 0, 5))).toBe("2024-01-05");
  });
});
