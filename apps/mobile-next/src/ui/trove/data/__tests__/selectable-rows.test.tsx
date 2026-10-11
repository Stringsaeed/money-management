import { fireEvent, render, screen } from "@testing-library/react-native";

import { ListGroup } from "../list-group";
import { ListRow } from "../list-row";
import { ProgressBar } from "../progress-bar";

describe("selectable ListRow", () => {
  it("is a checkbox with its checked state and toggles on press", async () => {
    const onPress = jest.fn();
    await render(
      <ListGroup>
        <ListRow checked onPress={onPress} subtitle="AED 120 a month" title="Rent" />
        <ListRow checked={false} onPress={onPress} title="Gym" />
      </ListGroup>,
    );
    const rent = screen.getByRole("checkbox", { name: "Rent" });
    expect(rent.props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByRole("checkbox", { name: "Gym" }).props.accessibilityState).toMatchObject({
      checked: false,
    });
    await fireEvent.press(rent);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is not a touch target when disabled but still reports its state", async () => {
    await render(<ListRow checked={false} disabled onPress={() => undefined} title="Card" />);
    const row = screen.getByRole("checkbox", { name: "Card" });
    expect(row.props.accessibilityState).toMatchObject({ checked: false, disabled: true });
    expect(row.props.onResponderRelease).toBeUndefined();
  });

  it("stays a button when not selectable", async () => {
    await render(<ListRow onPress={() => undefined} title="Currency" />);
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

describe("ProgressBar", () => {
  it("speaks its label and percentage", async () => {
    await render(<ProgressBar accessibilityLabel="Groceries" fraction={0.42} />);
    const bar = screen.getByRole("progressbar", { name: "Groceries" });
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 42 });
  });

  it("clamps the fill and hides from assistive tech without a label", async () => {
    await render(<ProgressBar fraction={3} testID="bar" />);
    const bar = screen.getByTestId("bar", { includeHiddenElements: true });
    expect(bar.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(bar.children).toHaveLength(1);
  });
});
