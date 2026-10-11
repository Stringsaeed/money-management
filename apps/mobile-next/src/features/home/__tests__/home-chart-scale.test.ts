import { describe, expect, it } from "@jest/globals";

import {
  homeBarHeight,
  homeChartDomain,
  homeGridValues,
  homeLineLabelTops,
  homeLineY,
  HOME_LINE_LABEL_HEIGHT,
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
  // A 300pt plot: month centres at 25, 75, ... 275.
  const series = (...ys: number[]) => ys.map((y, index) => ({ x: 25 + index * 50, y }));

  it("hangs each label 4pt under its point on flat lines, as on the board", () => {
    const tops = homeLineLabelTops({
      width: 300,
      income: series(14, 14, 14, 14, 14, 14),
      spend: series(40, 36, 44, 30, 38, 66),
      incomeLabel: "12,000",
      spendLabel: "4,286 SO FAR",
    });
    expect(tops).toEqual({ income: 18, spend: 70 });
  });

  it("keeps labels inside the plot and apart from each other", () => {
    const tops = homeLineLabelTops({
      width: 300,
      income: series(14, 14, 14, 14, 14, 95),
      spend: series(40, 36, 44, 30, 38, 94),
      incomeLabel: "815",
      spendLabel: "4,300 SO FAR",
    });
    for (const top of [tops.income, tops.spend]) {
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(96 - HOME_LINE_LABEL_HEIGHT);
    }
    expect(Math.abs(tops.income - tops.spend)).toBeGreaterThanOrEqual(HOME_LINE_LABEL_HEIGHT);
  });

  it("moves the so-far label off a steep income line that would run through it", () => {
    // October income collapses from the top to the bottom across the label's span.
    const tops = homeLineLabelTops({
      width: 300,
      income: series(14, 14, 14, 14, 8, 90),
      spend: series(40, 36, 44, 30, 46, 64),
      incomeLabel: "815",
      spendLabel: "4,300 SO FAR",
    });
    const preferred = 64 + 4;
    expect(tops.spend).not.toBe(preferred);
    expect(Math.abs(tops.income - tops.spend)).toBeGreaterThanOrEqual(HOME_LINE_LABEL_HEIGHT);
  });
});
