import { fireEvent, render, screen } from "@testing-library/react-native";

import { HomeEmptyState } from "@/components/home/home-empty-state";

describe("HomeEmptyState", () => {
  it("renders filtered copy and resets filters", () => {
    const onResetFilters = jest.fn();

    render(<HomeEmptyState activeFilterCount={2} onResetFilters={onResetFilters} />);

    fireEvent.press(screen.getByText("Reset Filters"));

    expect(screen.getByText("No transactions")).toBeOnTheScreen();
    expect(screen.getByText("No transactions match the current filters.")).toBeOnTheScreen();
    expect(onResetFilters).toHaveBeenCalled();
  });

  it("renders the default empty copy with no action", () => {
    render(<HomeEmptyState activeFilterCount={0} onResetFilters={jest.fn()} />);

    expect(
      screen.getByText("No transactions yet. Tap + Add Entry to get started."),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Reset Filters")).not.toBeOnTheScreen();
  });
});
