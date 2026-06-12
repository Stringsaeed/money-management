import { fireEvent, render, screen } from "@testing-library/react-native";

import HomeScreen from "@/app/(tabs)/(home)/index";

const mockUseHomeScreen = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `redirect:${href}`);
  },
}));

jest.mock("@/hooks/use-home-screen", () => ({
  useHomeScreen: () => mockUseHomeScreen(),
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
  it("redirects to onboarding when there are no accounts", () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [],
      loadingAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
      resetFilters: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText("redirect:/onboarding")).toBeOnTheScreen();
  });

  it("renders loading state", () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [{}],
      loadingAccounts: false,
      loadingTx: true,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
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
      loadingAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 2,
      activeAccountId: null,
      resetFilters,
    });

    render(<HomeScreen />);

    fireEvent.press(screen.getByText("empty:2"));

    expect(resetFilters).toHaveBeenCalled();
  });

  it("renders the journal list when groups exist", () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [{ currency: "USD" }],
      loadingAccounts: false,
      loadingTx: false,
      groups: [{ date: "2026-03-28", transactions: [] }],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
      resetFilters: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText("journal:1")).toBeOnTheScreen();
  });
});
