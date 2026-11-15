import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { iconPath } from "../../icon/icon-paths";
import { SelectChip } from "../select-chip";

/** PressableScale styles its animated body, the label's parent. */
const bodyStyle = (label: string) =>
  StyleSheet.flatten(screen.getByText(label).parent?.props.style);

describe("SelectChip", () => {
  it("is a checked radio when a solid chip is selected", async () => {
    const onPress = jest.fn();
    await render(<SelectChip label="25th" onPress={onPress} selected />);
    const chip = screen.getByRole("radio", { name: "25th" });
    expect(chip.props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is a 40pt payday chip by default and 38pt on request", async () => {
    await render(<SelectChip label="1st" onPress={jest.fn()} />);
    expect(bodyStyle("1st")).toMatchObject({ height: 40 });
    await render(<SelectChip label="28th" onPress={jest.fn()} size="md" />);
    expect(bodyStyle("28th")).toMatchObject({ height: 38 });
  });

  it("is a checkbox with a tick that keeps its width", async () => {
    await render(<SelectChip emoji="🚕" label="Taxis" onPress={jest.fn()} variant="check" />);
    expect(screen.getByRole("checkbox", { name: "Taxis" }).props.accessibilityState).toMatchObject({
      checked: false,
    });
    // The tick is laid out (hidden) even when unticked.
    expect(screen.getByText("✓", { includeHiddenElements: true })).toHaveStyle({ opacity: 0 });
  });

  it("names an envelope chip with its meta", async () => {
    await render(
      <SelectChip emoji="🍽️" label="Dining" meta="148" onPress={jest.fn()} variant="envelope" />,
    );
    expect(screen.getByRole("radio", { name: "Dining, 148" })).toBeTruthy();
    expect(screen.getByText("148")).toBeTruthy();
  });

  it("draws a dashed add chip with a plus", async () => {
    await render(<SelectChip label="Add a bill" onPress={jest.fn()} testID="add" variant="add" />);
    expect(screen.getByRole("button", { name: "Add a bill" })).toBeTruthy();
    expect(bodyStyle("Add a bill")).toMatchObject({ borderStyle: "dashed", height: 38 });
    expect(JSON.stringify(screen.toJSON())).toContain(iconPath("add", false));
  });
});
