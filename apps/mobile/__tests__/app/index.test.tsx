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

jest.mock("@/components/home/recent-journal-section", () => ({
  RecentJournalSection: ({
    activeFilterCount,
    groups,
    isLoading,
    onResetFilters,
  }: {
    activeFilterCount: number;
    groups: { date: string }[];
    isLoading: boolean;
    onResetFilters: () => void;
  }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: onResetFilters },
      React.createElement(
        Text,
        null,
        isLoading ? "journal:loading" : `journal:${groups.length}:filters:${activeFilterCount}`,
      ),
    );
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
  it("redirects to onboarding when there are no accounts", async () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [],
      hasAnyAccounts: false,
      loadingAccounts: false,
      loadingAllAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
      resetFilters: jest.fn(),
    });

    await render(<HomeScreen />);

    expect(screen.getByText("redirect:/onboarding")).toBeOnTheScreen();
  });

  it("renders loading state", async () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [{}],
      hasAnyAccounts: true,
      loadingAccounts: false,
      loadingAllAccounts: false,
      loadingTx: true,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
      resetFilters: jest.fn(),
    });

    await render(<HomeScreen />);

    expect(screen.getByText("header")).toBeOnTheScreen();
    expect(screen.getByText("journal:loading")).toBeOnTheScreen();
  });

  it("renders the empty state and allows filters to reset", async () => {
    const resetFilters = jest.fn();

    mockUseHomeScreen.mockReturnValue({
      accounts: [{}],
      hasAnyAccounts: true,
      loadingAccounts: false,
      loadingAllAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 2,
      activeAccountId: null,
      resetFilters,
    });

    await render(<HomeScreen />);

    await fireEvent.press(screen.getByText("journal:0:filters:2"));

    expect(resetFilters).toHaveBeenCalled();
  });

  it("renders the journal list when groups exist", async () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [{ currency: "USD" }],
      hasAnyAccounts: true,
      loadingAccounts: false,
      loadingAllAccounts: false,
      loadingTx: false,
      groups: [{ date: "2026-03-28", transactions: [] }],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
      resetFilters: jest.fn(),
    });

    await render(<HomeScreen />);

    expect(screen.getByText("journal:1:filters:0")).toBeOnTheScreen();
  });

  it("keeps account management reachable when every Account is archived", async () => {
    mockUseHomeScreen.mockReturnValue({
      accounts: [],
      hasAnyAccounts: true,
      loadingAccounts: false,
      loadingAllAccounts: false,
      loadingTx: false,
      groups: [],
      currency: "USD",
      activeFilterCount: 0,
      activeAccountId: null,
      resetFilters: jest.fn(),
    });

    await render(<HomeScreen />);

    expect(screen.queryByText("redirect:/onboarding")).not.toBeOnTheScreen();
    expect(screen.getByText("header")).toBeOnTheScreen();
  });
});
