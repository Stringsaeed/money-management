import { describe, expect, it } from "@jest/globals";

import {
  homeBarHeight,
  homeChartDomain,
  homeGridValues,
  homeLineLabelTops,
  homeLineY,
} from "../home-chart-scale";

const month = (incomeMinor: number, expenseMinor: number) => ({
  month: "2026-10",
  label: "OCT",
  incomeMinor,
  expenseMinor,
});

describe("home chart scale", () => {
  it("tops the domain 6% over the tallest month", () => {
    expect(homeChartDomain([month(1_320_000, 900_000), month(1_200_000, 1_020_000)])).toBeCloseTo(
      1_399_200,
    );
    expect(homeChartDomain([])).toBe(1);
  });

  it("maps values onto the 96pt plot", () => {
    expect(homeBarHeight(1_400_000, 1_400_000)).toBe(96);
    expect(homeBarHeight(700_000, 1_400_000)).toBe(48);
    expect(homeBarHeight(-5, 1_400_000)).toBe(0);
    expect(homeLineY(700_000, 1_400_000)).toBe(48);
  });

  it("draws round dashed guides under the top, as 5K and 10K on a 14K scale", () => {
    expect(homeGridValues(1_400_000)).toEqual([500_000, 1_000_000]);
    expect(homeGridValues(1)).toEqual([]);
  });
});

describe("homeLineLabelTops", () => {
  it("hangs each label 4pt under its point when they are apart", () => {
    expect(homeLineLabelTops(14, 66)).toEqual({ income: 18, spend: 70 });
  });

  it("keeps a label at the bottom inside the plot", () => {
    expect(homeLineLabelTops(14, 95).spend).toBe(83);
  });

  it("lifts the higher line's label above its point when the two collide", () => {
    const tops = homeLineLabelTops(94, 80);
    expect(tops.income).toBe(83);
    expect(tops.spend).toBe(63);
    expect(Math.abs(tops.income - tops.spend)).toBeGreaterThanOrEqual(13);
  });
});
