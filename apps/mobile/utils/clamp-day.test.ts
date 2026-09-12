import { describe, expect, it } from "@jest/globals";

import { clampDay } from "./date";

describe("clampDay", () => {
  it("clamps day into the month length without touching the clock", () => {
    expect(clampDay(2024, 2, 31)).toBe(29);
    expect(clampDay(2026, 4, 31)).toBe(30);
    expect(clampDay(2026, 1, 15)).toBe(15);
  });
});
