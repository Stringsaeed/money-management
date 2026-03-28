import { fireEvent, render, screen } from "@testing-library/react-native";

import { FilterBar } from "@/components/home/filter-bar";

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
  it("renders active filters and allows them to clear", () => {
    const setActiveAccountId = jest.fn();
    const setSelectedMonth = jest.fn();
    const setSelectedCategoryId = jest.fn();

    render(
      <FilterBar
        activeAccountName="Wallet"
        selectedYear={2026}
        selectedMonth={3}
        selectedCategoryName="Food"
        setActiveAccountId={setActiveAccountId}
        setSelectedMonth={setSelectedMonth}
        setSelectedCategoryId={setSelectedCategoryId}
      />,
    );

    fireEvent.press(screen.getByText("Wallet"));
    fireEvent.press(screen.getByText("March 2026"));
    fireEvent.press(screen.getByText("Food"));

    expect(setActiveAccountId).toHaveBeenCalledWith(null);
    expect(setSelectedMonth).toHaveBeenCalledWith(null, null);
    expect(setSelectedCategoryId).toHaveBeenCalledWith(null);
  });

  it("renders nothing when there are no active chips", () => {
    const { toJSON } = render(
      <FilterBar
        activeAccountName={null}
        selectedYear={null}
        selectedMonth={null}
        selectedCategoryName={null}
        setActiveAccountId={jest.fn()}
        setSelectedMonth={jest.fn()}
        setSelectedCategoryId={jest.fn()}
      />,
    );

    expect(toJSON()).toBeNull();
  });
});
