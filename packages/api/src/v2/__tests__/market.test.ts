import { describe, expect, it } from "vitest";
import { fetchMarketQuotes } from "../market-providers";
import { createMarketRoutes } from "../market";

describe("V2 Market", () => {
  it("reports unconfigured feeds without issuing requests or inventing prices", async () => {
    let requests = 0;
    const fetcher: typeof fetch = async () => {
      requests += 1;
      throw new Error("Unconfigured feeds must not call the network");
    };
    const quotes = await fetchMarketQuotes({ stocks: "", metals: "", crypto: "" }, fetcher);
    expect(requests).toBe(0);
    expect(quotes).toHaveLength(12);
    expect(quotes.every((quote) => quote.price === null && quote.error)).toBe(true);
  });

  it("keeps successful stock quotes when other assets fail and never returns provider secrets", async () => {
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      return url.searchParams.get("symbol") === "AAPL"
        ? Response.json({ close: "210.25", percent_change: "-0.5", timestamp: 1789900000 })
        : Response.json({ message: "private-provider-key" }, { status: 429 });
    };
    const quotes = await fetchMarketQuotes(
      { stocks: "private-provider-key", metals: "", crypto: "" },
      fetcher,
    );
    expect(quotes.find((quote) => quote.symbol === "AAPL")).toMatchObject({
      price: 210.25,
      changePercent: -0.5,
      error: null,
    });
    expect(quotes.find((quote) => quote.symbol === "NVDA")?.price).toBeNull();
    expect(JSON.stringify(quotes)).not.toContain("private-provider-key");
  });

  it("returns validated real prices and isolates a missing crypto symbol", async () => {
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      if (url.hostname === "api.metals.dev") {
        return Response.json({ status: "success", metals: { gold: 2500, silver: 30 } });
      }
      return Response.json({
        symbols: [{ symbol: "BTC", last: "60000", daily_change_percentage: "1.5" }],
      });
    };
    const app = createMarketRoutes({
      keys: { stocks: "", metals: "test", crypto: "test" },
      fetcher,
    });
    const response = await app.request("/market");
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"price":2500');
    expect(body).toContain('"price":60000');
    expect(body).toContain("temporarily unavailable");
  });
});
