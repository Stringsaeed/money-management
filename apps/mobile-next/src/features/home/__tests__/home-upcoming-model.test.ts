import { describe, expect, it } from "@jest/globals";
import type { V2Category, V2RecurringRule } from "@trove/api/v2/contracts";

import type { UpcomingOccurrence } from "@/data/ledger-schemas";

import { budgetView } from "../__fixtures__/budget-view";
import { homeUpcoming } from "../home-upcoming-model";

const rule = (id: string, name: string, categoryId: string | null): V2RecurringRule => ({
  id,
  ledgerId: "l1",
  name,
  accountId: "a1",
  categoryId,
  toAccountId: null,
  kind: "expense",
  amountMinor: 0,
  currency: "AED",
  note: "",
  frequency: "month",
  intervalCount: 1,
  startDate: "2026-01-01",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
  lifecycle: "active",
  health: "ready",
  mode: "remind",
  attentionReasons: [],
  eligibilityFloor: "2026-01-01",
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const category = (id: string, icon: string): V2Category => ({
  id,
  ledgerId: "l1",
  name: id,
  kind: "expense",
  color: "#8A8A96",
  icon,
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const occurrence = (
  ruleId: string,
  scheduledDate: string,
  amountMinor: number,
  kind: UpcomingOccurrence["kind"] = "expense",
): UpcomingOccurrence => ({ ruleId, scheduledDate, amountMinor, currency: "AED", kind });

const rules = [
  rule("car", "Car loan", "c-car"),
  rule("du", "du", "c-net"),
  rule("salary", "Salary", "c-salary"),
  rule("gym", "Gym", null),
];
const categories = [category("c-car", "🚗"), category("c-net", "📶"), category("c-salary", "💼")];
const occurrences = [
  occurrence("salary", "2026-10-25", 1_200_000, "income"),
  occurrence("du", "2026-10-18", 37_500),
  occurrence("car", "2026-10-11", 185_000),
  occurrence("gym", "2026-10-13", 25_000),
];
const budget = budgetView([
  {
    id: "env-car",
    group: "bills",
    categoryIds: ["c-car"],
    plannedMinor: 185_000,
    leftMinor: 185_000,
  },
  {
    id: "env-net",
    group: "bills",
    categoryIds: ["c-net"],
    plannedMinor: 30_000,
    leftMinor: 30_000,
  },
]);

describe("homeUpcoming", () => {
  it("lists the nearest three with emoji, signed amounts and the next one marked", () => {
    const { items } = homeUpcoming({
      occurrences,
      rules,
      categories,
      currency: "AED",
      today: "2026-10-11",
      budget,
    });
    expect(items.map((item) => [item.title, item.emoji, item.minor, item.next])).toEqual([
      ["Car loan", "🚗", -185_000, true],
      ["Gym", null, -25_000, false],
      ["du", "📶", -37_500, false],
    ]);
  });

  it("reads bills against their envelope: ready, or short by what is missing", () => {
    const { items } = homeUpcoming({
      occurrences,
      rules,
      categories,
      currency: "AED",
      today: "2026-10-11",
      budget,
    });
    expect(items.map((item) => [item.meta, item.short])).toEqual([
      ["TODAY · BILLS · READY", false],
      ["IN 2 DAYS · RECURRING", false],
      ["IN 7 DAYS · SHORT 75", true],
    ]);
  });

  it("captions everything as recurring without a budget", () => {
    const { items } = homeUpcoming({
      occurrences,
      rules,
      categories,
      currency: "AED",
      today: "2026-10-11",
      budget: null,
    });
    expect(items.every((item) => item.meta.endsWith("· RECURRING"))).toBe(true);
  });

  it("counts bills due within a week for the bell, not income or later bills", () => {
    const { dueThisWeek } = homeUpcoming({
      occurrences,
      rules,
      categories,
      currency: "AED",
      today: "2026-10-11",
      budget: null,
    });
    expect(dueThisWeek).toBe(3);
  });

  it("skips other currencies and occurrences whose rule is gone", () => {
    const { items } = homeUpcoming({
      occurrences: [
        { ...occurrence("car", "2026-10-11", 185_000), currency: "USD" },
        occurrence("deleted", "2026-10-12", 1_000),
      ],
      rules,
      categories,
      currency: "AED",
      today: "2026-10-11",
      budget: null,
    });
    expect(items).toEqual([]);
  });
});
