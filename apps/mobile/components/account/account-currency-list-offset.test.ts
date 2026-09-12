import { describe, expect, it } from "@jest/globals";

import { accountCurrencyListOffset } from "./account-currency-list-scroll";

describe("accountCurrencyListOffset", () => {
  it("offsets rows by list padding and gap", () => {
    expect(accountCurrencyListOffset(0, 44)).toBe(12);
    expect(accountCurrencyListOffset(2, 44)).toBe(12 + 2 * (44 + 8));
  });
});
