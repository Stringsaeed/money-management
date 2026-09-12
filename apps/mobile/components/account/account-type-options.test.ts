import { describe, expect, it } from "@jest/globals";

import { AccountTypeColors } from "@/constants/theme";

import { ACCOUNT_TYPE_OPTIONS } from "./account-form-options";

describe("ACCOUNT_TYPE_OPTIONS", () => {
  it("locks checking through other account type vocabulary", () => {
    expect(ACCOUNT_TYPE_OPTIONS).toEqual([
      {
        value: "checking",
        label: "Checking",
        emoji: "💳",
        systemIcon: "creditcard.fill",
        description: "For everyday spending, bills, and quick transfers.",
        color: AccountTypeColors.checking,
      },
      {
        value: "savings",
        label: "Savings",
        emoji: "🏦",
        systemIcon: "building.columns.fill",
        description: "For goals, rainy-day funds, and cash you keep parked.",
        color: AccountTypeColors.savings,
      },
      {
        value: "cash",
        label: "Cash",
        emoji: "💵",
        systemIcon: "banknote.fill",
        description: "For wallets, envelopes, and cash-on-hand balances.",
        color: AccountTypeColors.cash,
      },
      {
        value: "credit_card",
        label: "Credit Card",
        emoji: "💳",
        systemIcon: "creditcard.circle.fill",
        description: "For cards you pay down and want to watch closely.",
        color: AccountTypeColors.credit_card,
      },
      {
        value: "investment",
        label: "Investment",
        emoji: "📈",
        systemIcon: "chart.line.uptrend.xyaxis.circle.fill",
        description: "For brokerage, crypto, and longer-term growth accounts.",
        color: AccountTypeColors.investment,
      },
      {
        value: "other",
        label: "Other",
        emoji: "🏧",
        systemIcon: "tray.full.fill",
        description: "For anything that does not fit the usual account buckets.",
        color: AccountTypeColors.other,
      },
    ]);
  });
});
