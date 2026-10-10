import { fireEvent, render, screen } from "@testing-library/react-native";

import { FilterButton } from "../filter-button";
import { filterAccessibilityLabel, showsFilterCount } from "../utils";

describe("FilterButton", () => {
  it("is a plain Filter button when off and fires onPress", async () => {
    const onPress = jest.fn();
    await render(<FilterButton onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Filter" });
    expect(button.props.accessibilityState).toEqual({ selected: false });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("says active, without a badge, for a single filter", async () => {
    await render(<FilterButton active count={1} onPress={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Filter, active" });
    expect(button.props.accessibilityState).toEqual({ selected: true });
    expect(screen.queryByText("1")).toBeNull();
  });

  it("shows the count badge and speaks the count from two filters up", async () => {
    await render(<FilterButton active count={2} onPress={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Filter, 2 active" })).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("ignores a stale count while inactive", async () => {
    await render(<FilterButton count={3} onPress={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    expect(screen.queryByText("3")).toBeNull();
  });

  it("accepts a localised label", async () => {
    await render(<FilterButton active count={2} label="Filtern" onPress={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Filtern, 2 active" })).toBeTruthy();
  });
});

describe("filter helpers", () => {
  it("hides the count at 0 and 1", () => {
    expect(showsFilterCount({ active: false, count: 0 })).toBe(false);
    expect(showsFilterCount({ active: true, count: 1 })).toBe(false);
    expect(showsFilterCount({ active: true, count: 2 })).toBe(true);
    expect(filterAccessibilityLabel("Filter", { active: true, count: 5 })).toBe("Filter, 5 active");
  });
});
