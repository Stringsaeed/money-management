import { describe, expect, it } from "@jest/globals";

import { getReliableCurrencySymbol } from "./account-currency-utils";

describe("getReliableCurrencySymbol", () => {
  it("returns short distinct symbols and null when the symbol is the code", () => {
    expect(getReliableCurrencySymbol("USD", "en-US")).toBe("$");
    expect(getReliableCurrencySymbol("EUR", "en-US")).toBe("€");
    expect(getReliableCurrencySymbol("AED", "en-US")).toBeNull();
  });
});
