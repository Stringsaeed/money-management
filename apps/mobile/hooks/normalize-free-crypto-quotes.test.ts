import { describe, expect, it } from "@jest/globals";

import { normalizeFreeCryptoQuotes } from "./use-market-quotes";

describe("normalizeFreeCryptoQuotes", () => {
  it("pulls quote objects from symbols/data/result array or singleton shapes", () => {
    const quote = { symbol: "BTC", last: 1 };
    expect(normalizeFreeCryptoQuotes({ symbols: [quote, "x"] })).toEqual([quote]);
    expect(normalizeFreeCryptoQuotes({ data: [quote] })).toEqual([quote]);
    expect(normalizeFreeCryptoQuotes({ result: quote })).toEqual([quote]);
    expect(normalizeFreeCryptoQuotes({})).toEqual([]);
  });
});
