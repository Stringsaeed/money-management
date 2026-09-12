import { describe, expect, it } from "@jest/globals";

import { ACCOUNT_ICON_OPTIONS } from "./account-form-options";

describe("ACCOUNT_ICON_OPTIONS", () => {
  it("locks the account icon emoji vocabulary", () => {
    expect(ACCOUNT_ICON_OPTIONS).toEqual([
      "💳",
      "🏦",
      "💵",
      "💰",
      "📈",
      "🏧",
      "💸",
      "🪙",
      "💴",
      "💶",
      "💷",
      "💎",
      "🏠",
      "🚗",
      "✈️",
      "📱",
      "💼",
      "📊",
      "🔐",
      "✨",
    ]);
  });
});
