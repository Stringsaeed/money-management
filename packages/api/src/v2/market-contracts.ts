import { z } from "zod";

export const marketQuoteSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  group: z.enum(["stocks", "metals", "crypto"]),
  price: z.number().finite().nonnegative().nullable(),
  currency: z.literal("USD"),
  changePercent: z.number().finite().nullable(),
  updatedAt: z.string().nullable(),
  error: z.string().nullable(),
});

export const marketResponseSchema = z.object({
  quotes: z.array(marketQuoteSchema),
  fetchedAt: z.string(),
});

export type MarketQuote = z.infer<typeof marketQuoteSchema>;
export type MarketResponse = z.infer<typeof marketResponseSchema>;
export type MarketAsset = Pick<MarketQuote, "id" | "symbol" | "name" | "group">;

export const MARKET_ASSETS: readonly MarketAsset[] = [
  { id: "nvda", symbol: "NVDA", name: "NVIDIA", group: "stocks" },
  { id: "googl", symbol: "GOOGL", name: "Alphabet", group: "stocks" },
  { id: "aapl", symbol: "AAPL", name: "Apple", group: "stocks" },
  { id: "msft", symbol: "MSFT", name: "Microsoft", group: "stocks" },
  { id: "amzn", symbol: "AMZN", name: "Amazon", group: "stocks" },
  { id: "gold", symbol: "XAU/USD", name: "Gold Spot", group: "metals" },
  { id: "silver", symbol: "XAG/USD", name: "Silver Spot", group: "metals" },
  { id: "btc", symbol: "BTC", name: "Bitcoin", group: "crypto" },
  { id: "eth", symbol: "ETH", name: "Ethereum", group: "crypto" },
  { id: "usdt", symbol: "USDT", name: "Tether", group: "crypto" },
  { id: "xrp", symbol: "XRP", name: "XRP", group: "crypto" },
  { id: "bnb", symbol: "BNB", name: "BNB", group: "crypto" },
];

export function unavailableQuote(asset: MarketAsset, error: string): MarketQuote {
  return { ...asset, price: null, currency: "USD", changePercent: null, updatedAt: null, error };
}
