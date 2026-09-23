import { Hono } from "hono";
import { marketResponseSchema } from "./market-contracts";
import { fetchMarketQuotes, type MarketKeys } from "./market-providers";

export interface MarketRouteDependencies {
  readonly keys: MarketKeys;
  readonly fetcher?: typeof fetch;
  readonly getCache?: () => Cache | undefined;
}

// Mount after the V2 authentication middleware. Cached quotes contain no user data.
export function createMarketRoutes(dependencies: MarketRouteDependencies) {
  const routes = new Hono();
  routes.get("/market", async (context) => {
    const cache = dependencies.getCache?.();
    const key = new Request(new URL("/api/v2/market", context.req.url));
    const cached = await cache?.match(key);
    if (cached) return cached;
    const quotes = await fetchMarketQuotes(dependencies.keys, dependencies.fetcher);
    const payload = marketResponseSchema.parse({ quotes, fetchedAt: new Date().toISOString() });
    const response = Response.json(payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
    if (cache && quotes.some((quote) => quote.price !== null)) {
      const shared = Response.json(payload, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
      await cache.put(key, shared);
    }
    return response;
  });
  return routes;
}
