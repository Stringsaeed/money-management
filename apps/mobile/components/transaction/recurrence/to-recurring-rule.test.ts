import { describe, expect, it } from "@jest/globals";

import type { Category } from "@/types";

import type { TransactionFormData } from "../types";
import { toRecurringRuleDraft } from "./to-recurring-rule";

const baseForm = (overrides: Partial<TransactionFormData> = {}): TransactionFormData => ({
  type: "expense",
  amount: 2500,
  accountId: "acct_1",
  toAccountId: null,
  categoryId: "cat_1",
  isRecurring: true,
  description: "Rent",
  date: new Date(2026, 2, 15),
  currency: "USD",
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  recurrence: {
    frequency: "month",
    intervalCount: 1,
    endDate: null,
    endCount: null,
  },
  ...overrides,
});

const category = (overrides: Partial<Category> = {}): Category => ({
  id: "cat_1",
  name: "Housing",
  type: "expense",
  color: "#000000",
  icon: "🏠",
  parentId: null,
  sortOrder: 0,
  lifecycle: "active",
  lifecycleChangedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("toRecurringRuleDraft", () => {
  it("maps form fields and prefers description as the draft name", () => {
    const draft = toRecurringRuleDraft(
      baseForm({
        recurrence: {
          frequency: "week",
          intervalCount: 2,
          endDate: new Date(2026, 5, 1),
          endCount: 12,
        },
      }),
      [category()],
      "America/New_York",
    );

    expect(draft).toEqual({
      name: "Rent",
      type: "expense",
      amountMinor: 2500,
      currency: "USD",
      accountId: "acct_1",
      toAccountId: null,
      categoryId: "cat_1",
      description: "Rent",
      frequency: "week",
      intervalCount: 2,
      startDate: "2026-03-15",
      endDate: "2026-06-01",
      endCount: 12,
      timeZone: "America/New_York",
    });
  });

  it("falls back to category name then type label when description is empty", () => {
    expect(
      toRecurringRuleDraft(
        baseForm({ description: "", categoryId: "cat_1" }),
        [category({ name: "Housing" })],
        "UTC",
      ).name,
    ).toBe("Housing");

    expect(
      toRecurringRuleDraft(
        baseForm({ description: "", categoryId: null, type: "income" }),
        [category()],
        "UTC",
      ).name,
    ).toBe("Income");

    expect(
      toRecurringRuleDraft(
        baseForm({
          description: "",
          categoryId: "missing",
          type: "transfer",
          toAccountId: "acct_2",
        }),
        [category()],
        "UTC",
      ).name,
    ).toBe("Transfer");
  });
});
