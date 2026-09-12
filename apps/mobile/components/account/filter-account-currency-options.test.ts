import { describe, expect, it } from "@jest/globals";

import { filterAccountCurrencyOptions } from "./account-currency-utils";

const OPTIONS = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
] as const;

describe("filterAccountCurrencyOptions", () => {
  it("returns a copy when the query is blank", () => {
    expect(filterAccountCurrencyOptions(OPTIONS, "  ")).toEqual([...OPTIONS]);
  });

  it("matches currency code or display name case-insensitively", () => {
    expect(filterAccountCurrencyOptions(OPTIONS, "eu")).toEqual([
      { code: "EUR", name: "Euro", symbol: "€" },
    ]);
    expect(filterAccountCurrencyOptions(OPTIONS, "yen")).toEqual([
      { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    ]);
  });
});
