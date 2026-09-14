import type { MarketQuote } from "@/hooks/use-market-quotes";

const ORIGINAL_ENV = process.env;

function createJsonResponse(body: unknown, init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: jest.fn().mockResolvedValue(body),
  };
}

describe("use-market-quotes", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("tracks confirmed top stocks, metals, and crypto pairs", () => {
    const { MARKET_ASSETS } =
      require("@/hooks/use-market-quotes") as typeof import("@/hooks/use-market-quotes");

    expect(MARKET_ASSETS.map((asset) => asset.symbol)).toEqual([
      "NVDA",
      "GOOGL",
      "AAPL",
      "MSFT",
      "AMZN",
      "XAU/USD",
      "XAG/USD",
      "BTC",
      "ETH",
      "USDT",
      "XRP",
      "BNB",
    ]);
  });

  it("builds market quotes and falls back when APIs miss data", async () => {
    process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY = "stocks-key";
    process.env.EXPO_PUBLIC_METALS_DEV_API_KEY = "metals-key";
    process.env.EXPO_PUBLIC_FREECRYPTO_API_KEY = "crypto-key";

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          currency: "USD",
          close: "1000.10",
          change: "12.50",
          percent_change: "1.5",
          exchange: "NASDAQ",
          is_market_open: true,
          datetime: "2026-05-30T10:00:00Z",
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}, { ok: false, status: 503 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          currency: "USD",
          close: "190.00",
          change: "-2.00",
          percent_change: "-1.04",
          exchange: "NASDAQ",
          is_market_open: false,
          datetime: "2026-05-30T10:00:00Z",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          currency: "USD",
          close: "430.00",
          change: "4.00",
          percent_change: "0.94",
          exchange: "NASDAQ",
          is_market_open: true,
          datetime: "2026-05-30T10:00:00Z",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: "error",
          message: "rate limited",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: "success",
          currency: "USD",
          timestamp: "2026-05-30T10:05:00Z",
          metals: {
            gold: 3325.1,
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: "success",
          data: [
            {
              symbol: "BTC",
              last: "104500.1",
              daily_change_percentage: "3.21",
              source_exchange: "Coinbase",
              date: "2026-05-30T10:05:00Z",
            },
            {
              symbol: "ETH",
              status: "error",
              message: "pair unavailable",
            },
            {
              symbol: "USDT",
              price: "1.00",
              change_24h: "0.01",
              exchange: "Kraken",
              updated_at: "2026-05-30T10:06:00Z",
            },
            {
              symbol: "XRP",
              last: "2.31",
              daily_change_percentage: "-0.25",
              source_exchange: "Kraken",
              timestamp: "2026-05-30T10:07:00Z",
            },
          ],
        }),
      );

    jest.doMock("react-native-nitro-fetch", () => ({
      fetch: mockFetch,
    }));

    const { fetchMarketQuotes } =
      require("@/hooks/use-market-quotes") as typeof import("@/hooks/use-market-quotes");

    const quotes = (await fetchMarketQuotes()) as MarketQuote[];

    expect(quotes).toHaveLength(12);

    expect(quotes[0]).toMatchObject({
      symbol: "NVDA",
      price: 1000.1,
      exchange: "NASDAQ",
      errorMessage: null,
    });
    expect(quotes[1]?.errorMessage).toBe("Twelve Data returned 503 for GOOGL");
    expect(quotes[4]?.errorMessage).toBe("rate limited");
    expect(quotes[5]).toMatchObject({
      symbol: "XAU/USD",
      price: 3325.1,
      exchange: "Metals.Dev",
    });
    expect(quotes[6]?.errorMessage).toBe("Metals.Dev did not return Silver Spot");
    expect(quotes[7]).toMatchObject({
      symbol: "BTC/USD",
      percentChange: 3.21,
      exchange: "Coinbase",
    });
    expect(quotes[8]?.errorMessage).toBe("pair unavailable");
    expect(quotes[9]).toMatchObject({
      symbol: "USDT/USD",
      price: 1,
      exchange: "Kraken",
    });
    expect(quotes[10]).toMatchObject({
      symbol: "XRP/USD",
      price: 2.31,
    });
    expect(quotes[11]?.errorMessage).toBe("FreeCryptoAPI did not return BNB");
  });

  it("normalizes crypto payload shapes and query enablement", () => {
    process.env.EXPO_PUBLIC_FREECRYPTOAPI_KEY = "fallback-key";

    const mockUseQuery = jest.fn((config) => config);

    jest.doMock("@tanstack/react-query", () => ({
      useQuery: mockUseQuery,
    }));

    const {
      hasMarketDataApiKeys,
      normalizeCryptoSymbol,
      normalizeFreeCryptoQuotes,
      useMarketQuotes,
    } = require("@/hooks/use-market-quotes") as typeof import("@/hooks/use-market-quotes");

    expect(hasMarketDataApiKeys()).toBe(true);
    expect(normalizeCryptoSymbol("btc/usd@kraken")).toBe("BTC");
    expect(normalizeCryptoSymbol(undefined)).toBe("");

    expect(
      normalizeFreeCryptoQuotes({
        symbols: [{ symbol: "BTC" }],
      }),
    ).toEqual([{ symbol: "BTC" }]);
    expect(
      normalizeFreeCryptoQuotes({
        data: { symbol: "ETH" },
      }),
    ).toEqual([{ symbol: "ETH" }]);
    expect(
      normalizeFreeCryptoQuotes({
        result: [{ symbol: "XRP" }, null, "bad"],
      }),
    ).toEqual([{ symbol: "XRP" }]);
    expect(normalizeFreeCryptoQuotes({ message: "nope" })).toEqual([]);

    useMarketQuotes();
    const queryConfig = mockUseQuery.mock.calls[0]?.[0];

    expect(mockUseQuery).toHaveBeenCalledTimes(1);
    expect(queryConfig).toMatchObject({
      queryKey: ["market-quotes"],
      enabled: true,
      staleTime: 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
    });
    expect(typeof queryConfig.queryFn).toBe("function");
  });
});
