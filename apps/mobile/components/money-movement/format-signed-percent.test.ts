import { describe, expect, it } from "@jest/globals";

import { formatSignedPercent } from "./market-formatters";

describe("formatSignedPercent", () => {
  it("formats signed percents with a null placeholder", () => {
    expect(formatSignedPercent(null)).toBe("--");
    expect(formatSignedPercent(1.5)).toBe("+1.50%");
    expect(formatSignedPercent(-2.25)).toBe("-2.25%");
    expect(formatSignedPercent(0)).toBe("0.00%");
  });
});
