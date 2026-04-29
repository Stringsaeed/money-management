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

interface FreeCryptoQuoteResponse {
  symbol?: string;
  price?: number | string;
  change_24h?: number | string;
  exchange?: string;
  updated_at?: string;
  timestamp?: string;
  data?: unknown;
  result?: unknown;
  status?: string;
  message?: string;
  error?: string;
}

const TWELVE_DATA_QUOTE_URL = "https://api.twelvedata.com/quote";
const FREE_CRYPTO_API_DATA_URL = "https://api.freecryptoapi.com/v1/getData";
const TWELVE_DATA_API_KEY = process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY;
const FREE_CRYPTO_API_KEY =
  process.env.EXPO_PUBLIC_FREECRYPTO_API_KEY ?? process.env.EXPO_PUBLIC_FREECRYPTOAPI_KEY;

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

function parseMaybeNumber(value: number | string | undefined) {
  if (value === undefined) return null;

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getCryptoSymbol(asset: MarketAssetDefinition) {
  return asset.symbol.split("/")[0] ?? asset.symbol;
}

async function fetchMarketQuote(asset: MarketAssetDefinition): Promise<MarketQuote> {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error("Add EXPO_PUBLIC_TWELVE_DATA_API_KEY to load stocks and metals.");
  }

  const params = new URLSearchParams({
    symbol: asset.symbol,
    apikey: TWELVE_DATA_API_KEY,
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

async function fetchCryptoQuotes(assets: MarketAssetDefinition[]): Promise<MarketQuote[]> {
  if (assets.length === 0) {
    return [];
  }

  if (!FREE_CRYPTO_API_KEY) {
    throw new Error("Add EXPO_PUBLIC_FREECRYPTO_API_KEY to load crypto quotes.");
  }

  const cryptoSymbols = assets.map(getCryptoSymbol);
  const params = new URLSearchParams({ symbol: cryptoSymbols.join("+") });
  const response = await fetch(`${FREE_CRYPTO_API_DATA_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${FREE_CRYPTO_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`FreeCryptoAPI returned ${response.status} for crypto quotes`);
  }

  const quotes = normalizeFreeCryptoQuotes((await response.json()) as FreeCryptoQuoteResponse);
  const quoteBySymbol = new Map(
    quotes.map((quote) => [normalizeCryptoSymbol(quote.symbol), quote] as const),
  );

  return assets.map((asset) => {
    const cryptoSymbol = getCryptoSymbol(asset);
    const quote = quoteBySymbol.get(normalizeCryptoSymbol(cryptoSymbol));

    if (!quote) {
      return buildFailedQuote(asset, new Error(`FreeCryptoAPI did not return ${asset.symbol}`));
    }

    if (quote.status === "error" || quote.error) {
      return buildFailedQuote(
        asset,
        new Error(quote.message ?? quote.error ?? `FreeCryptoAPI could not load ${asset.symbol}`),
      );
    }

    return {
      ...asset,
      symbol: `${cryptoSymbol}/USD`,
      currency: "USD",
      price: parseMaybeNumber(quote.price),
      change: null,
      percentChange: parseMaybeNumber(quote.change_24h),
      exchange: quote.exchange ?? "FreeCryptoAPI",
      isMarketOpen: true,
      updatedAt: quote.updated_at ?? quote.timestamp ?? new Date().toISOString(),
      errorMessage: null,
    };
  });
}

function normalizeFreeCryptoQuotes(response: FreeCryptoQuoteResponse): FreeCryptoQuoteResponse[] {
  if (Array.isArray(response.data)) {
    return response.data.filter(isFreeCryptoQuoteResponse);
  }

  if (Array.isArray(response.result)) {
    return response.result.filter(isFreeCryptoQuoteResponse);
  }

  if (isFreeCryptoQuoteResponse(response.data)) {
    return [response.data];
  }

  if (isFreeCryptoQuoteResponse(response.result)) {
    return [response.result];
  }

  return [response];
}

function isFreeCryptoQuoteResponse(value: unknown): value is FreeCryptoQuoteResponse {
  return typeof value === "object" && value !== null;
}

function normalizeCryptoSymbol(symbol: string | undefined) {
  return symbol?.split("@")[0]?.split("/")[0]?.toUpperCase() ?? "";
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
  const regularAssets = MARKET_ASSETS.filter((asset) => asset.group !== "Crypto");
  const cryptoAssets = MARKET_ASSETS.filter((asset) => asset.group === "Crypto");

  const regularQuoteResults = await Promise.allSettled(regularAssets.map(fetchMarketQuote));
  const regularQuotes = regularQuoteResults.map((result, index): MarketQuote => {
    const asset = regularAssets[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    if (asset) {
      return buildFailedQuote(asset, result.reason);
    }

    return buildFailedQuote(
      { symbol: "UNKNOWN", label: "Unknown", group: "Stocks", emoji: "?" },
      result.reason,
    );
  });

  const cryptoQuotes = await fetchCryptoQuotes(cryptoAssets).catch((error: unknown) =>
    cryptoAssets.map((asset) => buildFailedQuote(asset, error)),
  );

  const quoteBySymbol = new Map(
    [...regularQuotes, ...cryptoQuotes].map((quote) => [quote.symbol, quote] as const),
  );

  return MARKET_ASSETS.map(
    (asset) => quoteBySymbol.get(asset.symbol) ?? buildFailedQuote(asset, "Quote unavailable"),
  );
}

export function useMarketQuotes() {
  return useQuery({
    queryKey: ["market-quotes"],
    enabled: hasMarketDataApiKeys(),
    queryFn: fetchMarketQuotes,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function hasMarketDataApiKeys() {
  return Boolean(TWELVE_DATA_API_KEY || FREE_CRYPTO_API_KEY);
}
