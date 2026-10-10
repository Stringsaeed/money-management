import { describe, expect, it } from "@jest/globals";

import { homeFlowData, homeFlowRangeLabel } from "../home-flow-data";
import type { HomeOverview } from "../home-model-types";

const point = (date: string, incomeMinor: number, expenseMinor: number) => ({
  date,
  balanceMinor: 0,
  incomeMinor,
  expenseMinor,
});

const overview = (points: HomeOverview["points"]): HomeOverview => ({
  balanceMinor: 0,
  incomeMinor: 0,
  expenseMinor: 0,
  points,
  currency: "USD",
  startDate: "2026-09-01",
  endDate: "2026-09-15",
});

describe("homeFlowData", () => {
  it("labels a week by weekday", () => {
    const data = homeFlowData(overview([point("2026-09-14", 100, 40)]), "week");
    expect(data).toEqual([{ label: "Mon", incomeMinor: 100, expenseMinor: 40 }]);
  });

  it("labels a year by month", () => {
    const data = homeFlowData(overview([point("2026-02-01", 5, 6)]), "year");
    expect(data[0]?.label).toBe("Feb");
  });

  it("folds a month into weekly buckets labelled by their first day", () => {
    const days = Array.from({ length: 15 }, (_, index) =>
      point(`2026-09-${String(index + 1).padStart(2, "0")}`, 10, 4),
    );
    const data = homeFlowData(overview(days), "month");
    expect(data.map((datum) => datum.label)).toEqual(["1", "8", "15"]);
    expect(data[0]).toEqual({ label: "1", incomeMinor: 70, expenseMinor: 28 });
    expect(data[2]).toEqual({ label: "15", incomeMinor: 10, expenseMinor: 4 });
  });
});

describe("homeFlowRangeLabel", () => {
  it("prints the span and currency in capitals", () => {
    expect(homeFlowRangeLabel(overview([]))).toBe("1 SEP – 15 SEP · USD");
  });
});
