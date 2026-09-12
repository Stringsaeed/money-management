import { describe, expect, it } from "@jest/globals";

import { normalizeCryptoSymbol } from "./use-market-quotes";

describe("normalizeCryptoSymbol", () => {
  it("strips venue suffixes and uppercases the base symbol", () => {
    expect(normalizeCryptoSymbol("btc@kraken")).toBe("BTC");
    expect(normalizeCryptoSymbol("eth/usd")).toBe("ETH");
    expect(normalizeCryptoSymbol(undefined)).toBe("");
  });
});
