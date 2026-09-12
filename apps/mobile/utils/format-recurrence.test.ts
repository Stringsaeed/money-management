import { describe, expect, it } from "@jest/globals";

import { formatRecurrence } from "./recurring";

describe("formatRecurrence", () => {
  it("labels single-interval presets and every-N intervals", () => {
    expect(formatRecurrence({ frequency: "week", intervalCount: 1 })).toBe("Weekly");
    expect(formatRecurrence({ frequency: "month", intervalCount: 2 })).toBe("Every 2 months");
  });
});
