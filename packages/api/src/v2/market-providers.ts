import { fromUnixTime } from "date-fns";
import { z } from "zod";

import {
  MARKET_ASSETS,
  unavailableQuote,
  type MarketAsset,
  type MarketQuote,
} from "./market-contracts";

export interface MarketKeys {
  readonly stocks: string;
  readonly metals: string;
  readonly crypto: string;
}

const numeric = z
  .union([z.number(), z.string().trim().min(1)])
  .transform(Number)
  .pipe(z.number().finite());
const stockSchema = z.object({
  close: numeric.pipe(z.number().nonnegative()),
  percent_change: numeric.optional(),
  timestamp: z.number().optional(),
});
const metalsSchema = z.object({
  status: z.literal("success"),
  timestamp: z.string().optional(),
  metals: z.object({ gold: numeric, silver: numeric }),
});
const cryptoQuoteSchema = z.object({
  symbol: z.string(),
  last: numeric.pipe(z.number().nonnegative()),
  daily_change_percentage: numeric.optional(),
  date: z.string().optional(),
});
const cryptoSchema = z.object({ symbols: z.array(cryptoQuoteSchema) });

async function fetchStock(
  asset: MarketAsset,
  key: string,
  fetcher: typeof fetch,
): Promise<MarketQuote> {
  if (!key) return unavailableQuote(asset, "Stock quotes are not configured yet.");
  const url = new URL("https://api.twelvedata.com/quote");
  url.searchParams.set("symbol", asset.symbol);
  url.searchParams.set("apikey", key);
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Stock provider unavailable");
    const quote = stockSchema.parse(await response.json());
    return {
      ...asset,
      price: quote.close,
      currency: "USD",
      changePercent: quote.percent_change ?? null,
      updatedAt: quote.timestamp ? fromUnixTime(quote.timestamp).toISOString() : null,
      error: null,
    };
  } catch {
    return unavailableQuote(asset, "Stock quote unavailable. Try refreshing shortly.");
  }
}

async function fetchMetals(
  assets: readonly MarketAsset[],
  key: string,
  fetcher: typeof fetch,
): Promise<MarketQuote[]> {
  if (!key)
    return assets.map((asset) => unavailableQuote(asset, "Metal quotes are not configured yet."));
  const url = new URL("https://api.metals.dev/v1/latest");
  url.searchParams.set("api_key", key);
  url.searchParams.set("currency", "USD");
  url.searchParams.set("unit", "toz");
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Metals provider unavailable");
    const quotes = metalsSchema.parse(await response.json());
    return assets.map((asset) => ({
      ...asset,
      price: asset.id === "gold" ? quotes.metals.gold : quotes.metals.silver,
      currency: "USD",
      changePercent: null,
      updatedAt: quotes.timestamp ?? null,
      error: null,
    }));
  } catch {
    return assets.map((asset) =>
      unavailableQuote(asset, "Metal quotes unavailable. Try refreshing shortly."),
    );
  }
}

async function fetchCrypto(
  assets: readonly MarketAsset[],
  key: string,
  fetcher: typeof fetch,
): Promise<MarketQuote[]> {
  if (!key)
    return assets.map((asset) => unavailableQuote(asset, "Crypto quotes are not configured yet."));
  const symbols = assets.map((asset) => asset.symbol).join("+");
  const url = `https://api.freecryptoapi.com/v1/getData?symbol=${symbols}`;
  try {
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Crypto provider unavailable");
    const quotes = cryptoSchema.parse(await response.json());
    return assets.map((asset) => {
      const quote = quotes.symbols.find(
        (item) => item.symbol.split("@")[0]?.split("/")[0]?.toUpperCase() === asset.symbol,
      );
      if (!quote) return unavailableQuote(asset, "This crypto quote is temporarily unavailable.");
      return {
        ...asset,
        price: quote.last,
        currency: "USD",
        changePercent: quote.daily_change_percentage ?? null,
        updatedAt: quote.date ?? null,
        error: null,
      };
    });
  } catch {
    return assets.map((asset) =>
      unavailableQuote(asset, "Crypto quotes unavailable. Try refreshing shortly."),
    );
  }
}

export async function fetchMarketQuotes(
  keys: MarketKeys,
  fetcher: typeof fetch = fetch,
): Promise<MarketQuote[]> {
  const stocks = MARKET_ASSETS.filter((asset) => asset.group === "stocks");
  const metals = MARKET_ASSETS.filter((asset) => asset.group === "metals");
  const crypto = MARKET_ASSETS.filter((asset) => asset.group === "crypto");
  const groups = await Promise.all([
    Promise.all(stocks.map((asset) => fetchStock(asset, keys.stocks, fetcher))),
    fetchMetals(metals, keys.metals, fetcher),
    fetchCrypto(crypto, keys.crypto, fetcher),
  ]);
  return groups.flat();
}
