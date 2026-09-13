import {
  accountCurrencyListOffset,
  recoverAccountCurrencyListScroll,
} from "@/components/account/account-currency-list-scroll";
import { ACCOUNT_CURRENCIES } from "@/components/account/account-form-options";

describe("account currency list scroll", () => {
  it("places MXN using list padding and row gaps instead of packed 56px rows", () => {
    const mxnIndex = ACCOUNT_CURRENCIES.indexOf("MXN");

    expect(mxnIndex).toBe(12);
    expect(accountCurrencyListOffset(mxnIndex, 56)).toBe(780);
  });

  it("recovers a misscroll by jumping to the gapped two-line offset", () => {
    const list = {
      scrollToOffset: jest.fn(),
    };

    recoverAccountCurrencyListScroll(list, { index: 12, averageItemLength: 68 });
    expect(list.scrollToOffset).toHaveBeenCalledWith({ offset: 924, animated: false });
  });
});
