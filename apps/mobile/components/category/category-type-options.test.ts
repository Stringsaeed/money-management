import { describe, expect, it } from "@jest/globals";

import { Colors } from "@/constants/theme";

import { CATEGORY_TYPE_OPTIONS } from "./category-form-options";

describe("CATEGORY_TYPE_OPTIONS", () => {
  it("locks expense and income category type options", () => {
    expect(CATEGORY_TYPE_OPTIONS).toEqual([
      {
        value: "expense",
        label: "Expense",
        emoji: "💸",
        description: "Money going out — bills, food, shopping, and the like.",
        color: Colors.light.expense,
      },
      {
        value: "income",
        label: "Income",
        emoji: "💰",
        description: "Money coming in — salary, refunds, gifts, and payouts.",
        color: Colors.light.income,
      },
    ]);
  });
});
