import { describe, expect, it, jest } from "@jest/globals";

import { recoverAccountCurrencyListScroll } from "./account-currency-list-scroll";

describe("recoverAccountCurrencyListScroll", () => {
  it("scrolls to the computed offset without animation", () => {
    const scrollToOffset = jest.fn();
    recoverAccountCurrencyListScroll({ scrollToOffset }, { index: 3, averageItemLength: 40 });
    expect(scrollToOffset).toHaveBeenCalledWith({
      offset: 12 + 3 * (40 + 8),
      animated: false,
    });
  });

  it("no-ops when the list ref is null", () => {
    expect(() =>
      recoverAccountCurrencyListScroll(null, { index: 0, averageItemLength: 40 }),
    ).not.toThrow();
  });
});
