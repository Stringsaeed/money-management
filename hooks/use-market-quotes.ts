import { useQuery } from "@tanstack/react-query";

export type MarketAssetGroup = "Stocks" | "Metals" | "Crypto";

export interface MarketAssetDefinition {
  symbol: string;
  label: string;
  group: MarketAssetGroup;
  emoji: string;
}

export interface MarketQuote extends MarketAssetDefinition {
  currency: string;
  price: number | null;
  change: number | null;
  percentChange: number | null;
  exchange: string | null;
  isMarketOpen: boolean | null;
  updatedAt: string | null;
  errorMessage: string | null;
}

interface TwelveDataQuoteResponse {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  is_market_open?: boolean;
  status?: string;
  message?: string;
}

const TWELVE_DATA_QUOTE_URL = "https://api.twelvedata.com/quote";
const TWELVE_DATA_API_KEY = process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY;

export const MARKET_ASSETS: MarketAssetDefinition[] = [
  { symbol: "NVDA", label: "NVIDIA", group: "Stocks", emoji: "⚡️" },
  { symbol: "GOOGL", label: "Alphabet", group: "Stocks", emoji: "🔎" },
  { symbol: "AAPL", label: "Apple", group: "Stocks", emoji: "" },
  { symbol: "MSFT", label: "Microsoft", group: "Stocks", emoji: "🪟" },
  { symbol: "AMZN", label: "Amazon", group: "Stocks", emoji: "📦" },
  { symbol: "XAU/USD", label: "Gold Spot", group: "Metals", emoji: "🥇" },
  { symbol: "XAG/USD", label: "Silver Spot", group: "Metals", emoji: "🥈" },
  { symbol: "BTC/USD", label: "Bitcoin", group: "Crypto", emoji: "₿" },
  { symbol: "ETH/USD", label: "Ethereum", group: "Crypto", emoji: "◆" },
  { symbol: "USDT/USD", label: "Tether", group: "Crypto", emoji: "💵" },
  { symbol: "XRP/USD", label: "XRP", group: "Crypto", emoji: "💧" },
  { symbol: "BNB/USD", label: "BNB", group: "Crypto", emoji: "🟡" },
];

function parseNumber(value: string | undefined) {
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function fetchMarketQuote(asset: MarketAssetDefinition): Promise<MarketQuote> {
  const params = new URLSearchParams({
    symbol: asset.symbol,
    apikey: TWELVE_DATA_API_KEY ?? "",
  });

  const response = await fetch(`${TWELVE_DATA_QUOTE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Twelve Data returned ${response.status} for ${asset.symbol}`);
  }

  const quote = (await response.json()) as TwelveDataQuoteResponse;

  if (quote.status === "error") {
    throw new Error(quote.message ?? `Twelve Data could not load ${asset.symbol}`);
  }

  return {
    ...asset,
    currency: quote.currency ?? "USD",
    price: parseNumber(quote.close),
    change: parseNumber(quote.change),
    percentChange: parseNumber(quote.percent_change),
    exchange: quote.exchange ?? null,
    isMarketOpen: quote.is_market_open ?? null,
    updatedAt: quote.datetime ?? null,
    errorMessage: null,
  };
}

function buildFailedQuote(asset: MarketAssetDefinition, error: unknown): MarketQuote {
  return {
    ...asset,
    currency: "USD",
    price: null,
    change: null,
    percentChange: null,
    exchange: null,
    isMarketOpen: null,
    updatedAt: null,
    errorMessage: error instanceof Error ? error.message : "Quote unavailable",
  };
}

async function fetchMarketQuotes() {
  const quoteResults = await Promise.allSettled(MARKET_ASSETS.map(fetchMarketQuote));

  return quoteResults.map((result, index): MarketQuote => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const asset = MARKET_ASSETS[index];

    if (asset) {
      return buildFailedQuote(asset, result.reason);
    }

    return buildFailedQuote(
      { symbol: "UNKNOWN", label: "Unknown", group: "Stocks", emoji: "?" },
      result.reason,
    );
  });
}

export function useMarketQuotes() {
  return useQuery({
    queryKey: ["market-quotes"],
    enabled: Boolean(TWELVE_DATA_API_KEY),
    queryFn: fetchMarketQuotes,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function hasTwelveDataApiKey() {
  return Boolean(TWELVE_DATA_API_KEY);
}
