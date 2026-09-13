import {
  filterAccountCurrencyOptions,
  getCurrencyDisplayName,
  getReliableCurrencySymbol,
  listAccountCurrencyOptions,
  toAccountCurrencyOption,
} from "@/components/account/account-currency-utils";

describe("account currency utils", () => {
  it("resolves a human-readable display name for an ISO code", () => {
    expect(getCurrencyDisplayName("USD", "en")).toMatch(/dollar/i);
    expect(getCurrencyDisplayName("EUR", "en")).toMatch(/euro/i);
  });

  it("exposes a symbol only when it is short and distinct from the code", () => {
    expect(getReliableCurrencySymbol("USD", "en-US")).toBe("$");
    expect(getReliableCurrencySymbol("EUR", "en-US")).toBe("€");
    expect(getReliableCurrencySymbol("AED", "en-US")).toBeNull();
  });

  it("builds searchable options from the account currency list", () => {
    const options = listAccountCurrencyOptions("en");
    expect(options.some((option) => option.code === "JPY")).toBe(true);
    expect(toAccountCurrencyOption("GBP", "en").name.toLowerCase()).toContain("pound");
  });

  it("filters by ISO code case-insensitively", () => {
    const options = listAccountCurrencyOptions("en");
    expect(filterAccountCurrencyOptions(options, "eu").map((option) => option.code)).toEqual([
      "EUR",
    ]);
  });

  it("filters by display name case-insensitively", () => {
    const options = listAccountCurrencyOptions("en");
    const matches = filterAccountCurrencyOptions(options, "pound");
    expect(matches.map((option) => option.code)).toContain("GBP");
  });

  it("returns an empty list when nothing matches", () => {
    const options = listAccountCurrencyOptions("en");
    expect(filterAccountCurrencyOptions(options, "zzzz-nope")).toEqual([]);
  });
});
