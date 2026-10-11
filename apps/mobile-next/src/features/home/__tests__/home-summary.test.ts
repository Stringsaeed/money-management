import { describe, expect, it } from "@jest/globals";

import {
  homeChartRangeLabel,
  homeChartSpanLabel,
  homeChartWindow,
  homeSummary,
} from "../home-summary";

const NOW = new Date(2026, 9, 11, 9, 30);
const bucket = (date: string, incomeMinor: number, expenseMinor: number) => ({
  date,
  incomeMinor,
  expenseMinor,
  deltaMinor: incomeMinor - expenseMinor,
});

describe("homeChartWindow", () => {
  it("spans the first of the month five months back through today", () => {
    expect(homeChartWindow(NOW)).toEqual({ from: "2026-05-01", to: "2026-10-11" });
  });
});

describe("homeSummary", () => {
  const data = {
    openingBalanceMinor: 1_000_000,
    buckets: [
      bucket("2026-05-25", 1_200_000, 0),
      bucket("2026-05-28", 0, 840_000),
      bucket("2026-09-25", 1_320_000, 780_700),
      bucket("2026-10-03", 81_500, 0),
      bucket("2026-10-08", 0, 430_000),
    ],
  };

  it("folds daily buckets into six labelled months, oldest first", () => {
    const { months } = homeSummary(data, NOW);
    expect(months.map((month) => month.label)).toEqual(["MAY", "JUN", "JUL", "AUG", "SEP", "OCT"]);
    expect(months[0]).toEqual({
      month: "2026-05",
      label: "MAY",
      incomeMinor: 1_200_000,
      expenseMinor: 840_000,
    });
    expect(months[1]).toMatchObject({ incomeMinor: 0, expenseMinor: 0 });
    expect(months[5]).toMatchObject({ incomeMinor: 81_500, expenseMinor: 430_000 });
  });

  it("replays the balance for net worth and its change since last month ended", () => {
    const { netWorth } = homeSummary(data, NOW);
    expect(netWorth.balanceMinor).toBe(1_000_000 + 360_000 + 539_300 - 348_500);
    expect(netWorth.deltaMinor).toBe(81_500 - 430_000);
  });

  it("reads an empty ledger as zero everywhere", () => {
    const summary = homeSummary({ openingBalanceMinor: 0, buckets: [] }, NOW);
    expect(summary.netWorth).toEqual({ balanceMinor: 0, deltaMinor: 0 });
    expect(summary.months.every((month) => month.incomeMinor === 0)).toBe(true);
  });
});

describe("chart labels", () => {
  const { months } = homeSummary({ openingBalanceMinor: 0, buckets: [] }, NOW);

  it("stamps the range with the currency and the legend with an arrow", () => {
    expect(homeChartRangeLabel(months, "AED")).toBe("MAY – OCT · AED");
    expect(homeChartSpanLabel(months)).toBe("MAY → OCT");
  });
});
