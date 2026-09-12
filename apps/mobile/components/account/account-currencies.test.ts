import { describe, expect, it } from "@jest/globals";

import { ACCOUNT_CURRENCIES } from "./account-form-options";

describe("ACCOUNT_CURRENCIES", () => {
  it("locks the account currency code vocabulary", () => {
    expect(ACCOUNT_CURRENCIES).toEqual([
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "SAR",
      "AED",
      "INR",
      "BRL",
      "MXN",
    ]);
  });
});
