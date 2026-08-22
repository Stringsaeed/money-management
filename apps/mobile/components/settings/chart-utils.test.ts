import { formatCompactChartAmount } from "./chart-utils";

describe("formatCompactChartAmount", () => {
  it("rounds sub-thousand values to whole numbers", () => {
    expect(formatCompactChartAmount(64.95)).toBe("65");
    expect(formatCompactChartAmount(216.85)).toBe("217");
    expect(formatCompactChartAmount(-216.85)).toBe("-217");
  });

  it("formats thousands with compact labels", () => {
    expect(formatCompactChartAmount(3600)).toBe("3.6k");
    expect(formatCompactChartAmount(12000)).toBe("12k");
    expect(formatCompactChartAmount(-5400)).toBe("-5.4k");
  });
});
