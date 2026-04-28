import { MARKET_ASSETS } from "@/hooks/use-market-quotes";

describe("MARKET_ASSETS", () => {
  it("tracks confirmed top stocks, metals, and crypto pairs", () => {
    expect(MARKET_ASSETS.map((asset) => asset.symbol)).toEqual([
      "NVDA",
      "GOOGL",
      "AAPL",
      "MSFT",
      "AMZN",
      "XAU/USD",
      "XAG/USD",
      "BTC/USD",
      "ETH/USD",
      "USDT/USD",
      "XRP/USD",
      "BNB/USD",
    ]);
  });
});
