import { fireEvent, render, screen } from "@testing-library/react-native";

import HomeScreen from "@/app/index";

const mockUseRouter = jest.fn();
const mockUseHomeScreen = jest.fn();
const mockUseHomeInsights: jest.Mock = jest.fn();
const mockBuildHomeHeaderItems: jest.Mock = jest.fn();

const mockStackScreen = jest.fn((_: unknown) => null);

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `redirect:${href}`);
  },
  Stack: {
    Screen: (props: unknown) => mockStackScreen(props),
  },
  useRouter: () => mockUseRouter(),
}));

jest.mock("@/hooks/use-home-screen", () => ({
  useHomeScreen: () => mockUseHomeScreen(),
}));

jest.mock("@/hooks/use-home-insights", () => ({
  useHomeInsights: (args: unknown) => mockUseHomeInsights(args),
}));

jest.mock("@/utils/home-header-items", () => ({
  buildHomeHeaderItems: (args: unknown) => mockBuildHomeHeaderItems(args),
}));

jest.mock("@/components/home/home-empty-state", () => ({
  HomeEmptyState: ({
    activeFilterCount,
    onResetFilters,
  }: {
    activeFilterCount: number;
    onResetFilters: () => void;
  }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: onResetFilters },
      React.createElement(Text, null, `empty:${activeFilterCount}`),
    );
  },
}));

jest.mock("@/components/home/home-journal-list", () => ({
  HomeJournalList: ({ groups }: { groups: { date: string }[] }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `journal:${groups.length}`);
  },
}));

jest.mock("@/components/home/home-list-header", () => ({
  HomeListHeader: () => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, "header");
  },
}));

describe("app/index", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({ push: jest.fn() });
    mockBuildHomeHeaderItems.mockReturnValue({
      headerLeftItems: [{ type: "menu" }],
      headerRightItems: [{ type: "button" }],
    });
    mockUseHomeInsights.mockReturnValue({
      filteredBalance: 100_00,
      categorySpending: [],
      monthlyTrend: [],
    });
  });

  it("redirects to onboarding when there are no accounts", () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [],
      allCategories: [],
      dateRange: null,
      loadingAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccount: null,
      activeCategory: null,
      summary: undefined,
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
      setSelectedMonth: jest.fn(),
      setActiveAccountId: jest.fn(),
      setSelectedCategoryId: jest.fn(),
      resetFilters: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText("redirect:/onboarding")).toBeOnTheScreen();
  });

  it("renders loading state", () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [{}],
      allCategories: [],
      dateRange: null,
      loadingAccounts: false,
      loadingTx: true,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccount: null,
      activeCategory: null,
      summary: undefined,
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
      setSelectedMonth: jest.fn(),
      setActiveAccountId: jest.fn(),
      setSelectedCategoryId: jest.fn(),
      resetFilters: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText("header")).toBeOnTheScreen();
    expect(screen.queryByText(/journal:/)).not.toBeOnTheScreen();
  });

  it("renders the empty state and allows filters to reset", () => {
    const resetFilters = jest.fn();

    mockUseHomeScreen.mockReturnValue({
      accounts: [{}],
      allCategories: [],
      dateRange: null,
      loadingAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 2,
      activeAccount: null,
      activeCategory: null,
      summary: undefined,
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
      setSelectedMonth: jest.fn(),
      setActiveAccountId: jest.fn(),
      setSelectedCategoryId: jest.fn(),
      resetFilters,
    });

    render(<HomeScreen />);

    fireEvent.press(screen.getByText("empty:2"));

    expect(resetFilters).toHaveBeenCalled();
  });

  it("renders the journal list when groups exist", () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [{ currency: "USD" }],
      allCategories: [],
      dateRange: null,
      loadingAccounts: false,
      loadingTx: false,
      groups: [{ date: "2026-03-28", transactions: [] }],
      currency: "USD",
      activeFilterCount: 0,
      activeAccount: null,
      activeCategory: null,
      summary: undefined,
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
      setSelectedMonth: jest.fn(),
      setActiveAccountId: jest.fn(),
      setSelectedCategoryId: jest.fn(),
      resetFilters: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText("journal:1")).toBeOnTheScreen();
    expect(mockStackScreen).toHaveBeenCalled();
  });
});
