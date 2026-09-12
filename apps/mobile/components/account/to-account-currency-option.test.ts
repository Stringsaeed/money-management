import { describe, expect, it } from "@jest/globals";

import { toAccountCurrencyOption } from "./account-currency-utils";

describe("toAccountCurrencyOption", () => {
  it("builds a searchable currency option for an ISO code", () => {
    expect(toAccountCurrencyOption("USD", "en-US")).toEqual({
      code: "USD",
      name: expect.stringMatching(/dollar/i),
      symbol: "$",
    });
  });
});
