import { fireEvent, render, screen } from "@testing-library/react-native";

import { Breadcrumb } from "../breadcrumb";
import type { BreadcrumbSegmentSpec } from "../breadcrumb-segment";

const segments = (onPress?: () => void): BreadcrumbSegmentSpec[] => [
  { key: "account", emoji: "🏦", label: "Right", state: "set" },
  { key: "category", emoji: "🛒", label: "Groceries", state: "active", onPress },
  { key: "when", emoji: "📅", label: "Today", state: "unset" },
];

describe("Breadcrumb", () => {
  it("names the bar and every segment", async () => {
    await render(<Breadcrumb segments={segments()} />);
    expect(screen.getByLabelText("Entry details")).toBeTruthy();
    for (const label of ["Right", "Groceries", "Today"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("marks only the open segment as expanded", async () => {
    await render(<Breadcrumb segments={segments()} />);
    expect(screen.getByRole("button", { name: "Groceries" })).toBeExpanded();
    expect(screen.getByRole("button", { name: "Right" })).not.toBeExpanded();
    expect(screen.getByRole("button", { name: "Today" })).not.toBeExpanded();
  });

  it("tells an unset segment it has no value yet", async () => {
    await render(<Breadcrumb segments={segments()} />);
    expect(screen.getByRole("button", { name: "Today" }).props.accessibilityHint).toBe(
      "Not set yet",
    );
    expect(screen.getByRole("button", { name: "Right" }).props.accessibilityHint).toBeUndefined();
  });

  it("reports presses on a segment", async () => {
    const onPress = jest.fn();
    await render(<Breadcrumb segments={segments(onPress)} />);
    await fireEvent.press(screen.getByRole("button", { name: "Groceries" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("works as a toggle row: toggle buttons, selected state, no chevrons", async () => {
    await render(<Breadcrumb segments={segments()} variant="toggle" />);
    const active = screen.getByRole("togglebutton", { name: "Groceries" });
    expect(active).toBeSelected();
    expect(screen.getByRole("togglebutton", { name: "Right" })).not.toBeSelected();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("uses a custom accessibility label for a segment", async () => {
    await render(
      <Breadcrumb
        segments={[
          {
            key: "a",
            emoji: "🏷️",
            label: "Category",
            state: "unset",
            accessibilityLabel: "Choose a category",
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Choose a category" })).toBeTruthy();
  });
});
