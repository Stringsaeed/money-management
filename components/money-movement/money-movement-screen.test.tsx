import { fireEvent, render, screen } from "@testing-library/react-native";

import { MoneyMovementScreen } from "@/components/money-movement/money-movement-screen";
import type { MarketQuote } from "@/hooks/use-market-quotes";

const mockHasTwelveDataApiKey = jest.fn();
const mockUseMarketQuotes = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@/hooks/use-market-quotes", () => ({
  MARKET_ASSETS: [
    { symbol: "NVDA", label: "NVIDIA", group: "Stocks", emoji: "⚡️" },
    { symbol: "XAU/USD", label: "Gold Spot", group: "Metals", emoji: "🥇" },
    { symbol: "BTC/USD", label: "Bitcoin", group: "Crypto", emoji: "₿" },
  ],
  hasMarketDataApiKeys: () => mockHasTwelveDataApiKey(),
  useMarketQuotes: () => mockUseMarketQuotes(),
}));

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
}));

const buildQuote = (overrides: Partial<MarketQuote>): MarketQuote => ({
  symbol: "NVDA",
  label: "NVIDIA",
  group: "Stocks",
  emoji: "⚡️",
  currency: "USD",
  price: 216.61,
  change: 8.33,
  percentChange: 4,
  exchange: "NASDAQ",
  isMarketOpen: true,
  updatedAt: "2026-04-28 16:00:00",
  errorMessage: null,
  ...overrides,
});

describe("MoneyMovementScreen", () => {
  beforeEach(() => {
    mockRefetch.mockClear();
    mockHasTwelveDataApiKey.mockReturnValue(true);
    mockUseMarketQuotes.mockReturnValue({
      data: [],
      isFetching: false,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it("shows setup state when market API keys are missing", () => {
    mockHasTwelveDataApiKey.mockReturnValue(false);

    render(<MoneyMovementScreen />);

    expect(screen.getByText("Money Movement")).toBeOnTheScreen();
    expect(screen.getByText("Connect market APIs 🔌")).toBeOnTheScreen();
  });

  it("renders grouped market quotes and refreshes feed", () => {
    mockUseMarketQuotes.mockReturnValue({
      data: [
        buildQuote({ symbol: "NVDA", label: "NVIDIA", group: "Stocks" }),
        buildQuote({
          symbol: "XAU/USD",
          label: "Gold Spot",
          group: "Metals",
          emoji: "🥇",
          price: 3240.12,
          percentChange: -0.42,
        }),
        buildQuote({
          symbol: "BTC/USD",
          label: "Bitcoin",
          group: "Crypto",
          emoji: "₿",
          price: 77455.32,
          percentChange: 0.43,
        }),
      ],
      isFetching: false,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<MoneyMovementScreen />);

    expect(screen.getByText("Stocks")).toBeOnTheScreen();
    expect(screen.getByText("Metals")).toBeOnTheScreen();
    expect(screen.getByText("Crypto")).toBeOnTheScreen();
    expect(screen.getByText("NVIDIA")).toBeOnTheScreen();
    expect(screen.getByText("Gold Spot")).toBeOnTheScreen();
    expect(screen.getByText("Bitcoin")).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button"));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows error and empty states", () => {
    mockUseMarketQuotes.mockReturnValue({
      data: [],
      isFetching: false,
      isLoading: false,
      error: new Error("Quota reached"),
      refetch: mockRefetch,
    });

    const { rerender } = render(<MoneyMovementScreen />);

    expect(screen.getByText("Market feed paused")).toBeOnTheScreen();
    expect(screen.getByText("Quota reached")).toBeOnTheScreen();

    mockUseMarketQuotes.mockReturnValue({
      data: [],
      isFetching: false,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    rerender(<MoneyMovementScreen />);

    expect(screen.getByText("No quotes yet")).toBeOnTheScreen();
  });
});
