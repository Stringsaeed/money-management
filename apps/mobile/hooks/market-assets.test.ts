import { describe, expect, it } from "@jest/globals";

import { MARKET_ASSETS } from "./use-market-quotes";

describe("MARKET_ASSETS", () => {
  it("locks the market asset watchlist vocabulary", () => {
    expect(MARKET_ASSETS).toEqual([
      { symbol: "NVDA", label: "NVIDIA", group: "Stocks", emoji: "⚡️" },
      { symbol: "GOOGL", label: "Alphabet", group: "Stocks", emoji: "🔎" },
      { symbol: "AAPL", label: "Apple", group: "Stocks", emoji: "" },
      { symbol: "MSFT", label: "Microsoft", group: "Stocks", emoji: "🪟" },
      { symbol: "AMZN", label: "Amazon", group: "Stocks", emoji: "📦" },
      { symbol: "XAU/USD", label: "Gold Spot", group: "Metals", emoji: "🥇" },
      { symbol: "XAG/USD", label: "Silver Spot", group: "Metals", emoji: "🥈" },
      { symbol: "BTC", label: "Bitcoin", group: "Crypto", emoji: "₿" },
      { symbol: "ETH", label: "Ethereum", group: "Crypto", emoji: "◆" },
      { symbol: "USDT", label: "Tether", group: "Crypto", emoji: "💵" },
      { symbol: "XRP", label: "XRP", group: "Crypto", emoji: "💧" },
      { symbol: "BNB", label: "BNB", group: "Crypto", emoji: "🟡" },
    ]);
  });
});
