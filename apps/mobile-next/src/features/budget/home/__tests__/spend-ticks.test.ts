import { describe, expect, it } from "@jest/globals";
import type { V2Transaction } from "@trove/api/v2/contracts";

import { budgetView } from "@/features/home/__fixtures__/budget-view";

import { dailyEverydaySpend, everydayAllowanceMinor, spendTicks } from "../spend-ticks";

const view = budgetView([
  {
    id: "groceries",
    group: "everyday",
    categoryIds: ["c-groceries"],
    plannedMinor: 240_000,
    leftMinor: 100_000,
    rolloverMinor: 60_000,
  },
  { id: "car", group: "bills", categoryIds: ["c-car"], plannedMinor: 185_000, leftMinor: 185_000 },
]);

const spend = (date: string, amountMinor: number, categoryId = "c-groceries"): V2Transaction => ({
  id: `${date}-${amountMinor}-${categoryId}`,
  ledgerId: "l1",
  accountId: "a1",
  categoryId,
  toAccountId: null,
  kind: "expense",
  amountMinor,
  currency: "AED",
  date,
  note: "",
  recurringRuleId: null,
  version: 1,
  createdAt: `${date}T10:00:00Z`,
  updatedAt: `${date}T10:00:00Z`,
});

describe("everydayAllowanceMinor", () => {
  it("spreads everyday planned plus rollover evenly over the 30-day period", () => {
    expect(everydayAllowanceMinor(view)).toBe(10_000);
  });
});

describe("dailyEverydaySpend", () => {
  it("sums everyday spending per day in the period through today only", () => {
    const rows = [
      spend("2026-09-24", 5_000),
      spend("2026-09-26", 4_000),
      spend("2026-09-26", 3_000),
      spend("2026-09-27", 185_000, "c-car"),
      { ...spend("2026-09-28", 2_000), currency: "USD" },
      spend("2026-10-12", 9_000),
    ];
    const byDay = dailyEverydaySpend(rows, view, "AED", "2026-10-11");
    expect([...byDay]).toEqual([["2026-09-26", 7_000]]);
  });
});

describe("spendTicks", () => {
  it("prints one tick per day: under or over the allowance, today, then future days", () => {
    const ticks = spendTicks({
      period: { start: "2026-09-25", end: "2026-10-24" },
      today: "2026-10-11",
      spendByDay: new Map([
        ["2026-09-25", 10_000],
        ["2026-09-26", 10_001],
      ]),
      allowanceMinor: 10_000,
    });
    expect(ticks).toHaveLength(30);
    expect(ticks.slice(0, 3)).toEqual(["under", "over", "under"]);
    expect(ticks[16]).toBe("today");
    expect(ticks.slice(17).every((tick) => tick === "future")).toBe(true);
  });
});
