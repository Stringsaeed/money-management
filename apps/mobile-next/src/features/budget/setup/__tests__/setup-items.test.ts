import type { V2BudgetSetupFacts, V2Category } from "@trove/api/v2/contracts";

import { buildSetupItems, monthlyEquivalentMinor, suggestedMinor } from "../setup-items";

const category = (id: string, name: string, overrides: Partial<V2Category> = {}): V2Category => ({
  id,
  ledgerId: "ledger",
  name,
  kind: "expense",
  color: "#000000",
  icon: "tag",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

const facts: V2BudgetSetupFacts = {
  today: "2026-10-12",
  period: { start: "2026-10-01", end: "2026-10-31" },
  accountBalances: [],
  spendSincePeriodStart: [],
  cardPaymentsSincePeriodStart: [],
  openingCardDebtMinor: 0,
  lastPeriod: { start: "2026-09-01", end: "2026-09-30" },
  lastPeriodSpend: [{ categoryId: "groceries", amountMinor: 123_456 }],
  recurringExpenses: [
    {
      ruleId: "r1",
      name: "Internet",
      amountMinor: 35_000,
      currency: "AED",
      categoryId: "utilities",
      frequency: "month",
      intervalCount: 1,
    },
    {
      ruleId: "r2",
      name: "Gym",
      amountMinor: 10_000,
      currency: "USD",
      categoryId: null,
      frequency: "month",
      intervalCount: 1,
    },
  ],
  topCategories: [
    { categoryId: "groceries", name: "Groceries", transactionCount: 12 },
    { categoryId: "utilities", name: "Utilities", transactionCount: 3 },
  ],
};

describe("setup items", () => {
  const categories = [
    category("utilities", "Utilities"),
    category("groceries", "Groceries"),
    category("old", "Old", { archived: true }),
  ];

  it("pre-ticks Bills and Everyday from the ledger, with presets unticked and Bills winning", () => {
    const items = buildSetupItems({ facts, categories, custom: [] });
    const byKey = Object.fromEntries(items.map((entry) => [entry.key, entry]));

    expect(byKey["cat:utilities"]).toMatchObject({
      group: "bills",
      defaultTicked: true,
      recurringMinor: 35_000,
    });
    expect(byKey["cat:groceries"]).toMatchObject({
      group: "everyday",
      defaultTicked: true,
      lastPeriodMinor: 123_456,
    });
    expect(byKey["new:dewa"]).toMatchObject({ group: "bills", defaultTicked: false });
    expect(items.map((entry) => entry.group)).toEqual(
      [...items.map((entry) => entry.group)].sort(
        (left, right) =>
          ["bills", "everyday", "saving"].indexOf(left) -
          ["bills", "everyday", "saving"].indexOf(right),
      ),
    );
    // A foreign-currency rule is not offered, and a preset reuses the Category with its name.
    expect(items.some((entry) => entry.name === "Gym")).toBe(false);
    expect(items.filter((entry) => entry.categoryId === "groceries")).toHaveLength(1);
  });

  it("does not reuse an archived Category for a custom row", () => {
    const items = buildSetupItems({
      facts,
      categories,
      custom: [{ name: "old", group: "everyday" }],
    });

    expect(items.find((entry) => entry.key === "new:old")).toMatchObject({ categoryId: null });
  });
});

describe("suggestions", () => {
  it("turns a Recurring amount into a monthly figure in whole dirhams", () => {
    expect(
      monthlyEquivalentMinor({ amountMinor: 120_000, frequency: "year", intervalCount: 1 }),
    ).toBe(10_000);
    expect(
      monthlyEquivalentMinor({ amountMinor: 30_000, frequency: "month", intervalCount: 3 }),
    ).toBe(10_000);
    expect(
      monthlyEquivalentMinor({ amountMinor: 1_000, frequency: "week", intervalCount: 1 }),
    ).toBe(4_300);
  });

  it("prefers the Recurring amount, then last period's spend", () => {
    const base = {
      key: "k",
      name: "k",
      group: "bills" as const,
      categoryId: null,
      defaultTicked: true,
    };

    expect(suggestedMinor({ ...base, recurringMinor: 500_00, lastPeriodMinor: 90_00 })).toBe(
      500_00,
    );
    expect(suggestedMinor({ ...base, recurringMinor: null, lastPeriodMinor: 123_456 })).toBe(
      123_500,
    );
    expect(suggestedMinor({ ...base, recurringMinor: null, lastPeriodMinor: null })).toBeNull();
  });
});
