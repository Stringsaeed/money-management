import { fireEvent, render, screen } from "@testing-library/react-native";

import { FilterBar } from "@/components/home/filter-bar";
import { useUIStore } from "@/stores/ui-store";

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => ({
    data: [{ id: "account-1", name: "Wallet" }],
  }),
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategories: () => ({
    data: [{ id: "category-1", name: "Food" }],
  }),
}));

jest.mock("@/components/home/filter-chip", () => ({
  FilterChip: ({ label, onRemove }: { label: string; onRemove: () => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: onRemove },
      React.createElement(Text, null, label),
    );
  },
}));

describe("FilterBar", () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
    });
  });

  it("renders active filters and allows them to clear", async () => {
    useUIStore.setState({
      activeAccountId: "account-1",
      selectedYear: 2026,
      selectedMonth: 3,
      selectedCategoryId: "category-1",
    });

    await render(<FilterBar />);

    await fireEvent.press(screen.getByText("Wallet"));
    expect(useUIStore.getState().activeAccountId).toBeNull();

    await fireEvent.press(screen.getByText("March 2026"));
    expect(useUIStore.getState().selectedYear).toBeNull();
    expect(useUIStore.getState().selectedMonth).toBeNull();

    await fireEvent.press(screen.getByText("Food"));
    expect(useUIStore.getState().selectedCategoryId).toBeNull();
  });

  it("renders nothing when there are no active chips", async () => {
    const { toJSON } = await render(<FilterBar />);

    expect(toJSON()).toBeNull();
  });
});
