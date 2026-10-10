import type { MarketRowProps } from "@/ui/trove/market";

/** Mirrors the board's market rows; sub-cent prices are decimal strings on purpose. */
export const MARKET_SAMPLES = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "61240.18",
    changePercent: 2.4,
    sparkline: [58, 59, 58.5, 60, 59.4, 61, 61.2],
  },
  {
    symbol: "ETH",
    name: "Ether",
    price: "2412.07",
    changePercent: -1.1,
    sparkline: [25, 24.6, 24.9, 24.2, 24.4, 24, 24.1],
  },
  {
    symbol: "XAU",
    name: "Gold · per oz",
    price: "2384.40",
    changePercent: 0.3,
    sparkline: [23.6, 23.7, 23.7, 23.8, 23.75, 23.8, 23.84],
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: "0.1834",
    changePercent: 5.2,
    sparkline: [17, 17.2, 17.6, 17.5, 18, 18.2, 18.34],
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    price: "0.00001842",
    changePercent: -3.8,
    sparkline: [19.2, 19.1, 18.9, 18.95, 18.6, 18.5, 18.42],
  },
] as const satisfies readonly MarketRowProps[];
