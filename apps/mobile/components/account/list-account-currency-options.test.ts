import { ACCOUNT_CURRENCIES } from "@/components/account/account-form-options";
import { listAccountCurrencyOptions } from "@/components/account/account-currency-utils";

describe("listAccountCurrencyOptions", () => {
  it("maps every account currency code to a labeled option with symbols when reliable", () => {
    const options = listAccountCurrencyOptions("en-US");

    expect(options).toHaveLength(ACCOUNT_CURRENCIES.length);
    expect(new Set(options.map((option) => option.code))).toEqual(new Set(ACCOUNT_CURRENCIES));

    const usd = options.find((option) => option.code === "USD");
    expect(usd?.name.toLowerCase()).toMatch(/dollar/);
    expect(usd?.symbol).toBe("$");

    const aed = options.find((option) => option.code === "AED");
    expect(aed?.symbol).toBeNull();
  });
});
