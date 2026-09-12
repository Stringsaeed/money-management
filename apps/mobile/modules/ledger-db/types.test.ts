import { describe, expect, it } from "@jest/globals";

import { monthFilter } from "./types";

describe("monthFilter", () => {
  it("returns inclusive from/to bounds for a 31-day month", () => {
    expect(monthFilter(2026, 3)).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });

  it("returns leap-year February bounds", () => {
    expect(monthFilter(2024, 2)).toEqual({ from: "2024-02-01", to: "2024-02-29" });
  });
});
