import { describe, expect, it } from "@jest/globals";

import { getCurrencySymbol } from "./utils";

describe("getCurrencySymbol", () => {
  it("maps known ISO currencies to symbols", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  it("falls back to the currency code when unmapped", () => {
    expect(getCurrencySymbol("AED")).toBe("AED");
  });
});
