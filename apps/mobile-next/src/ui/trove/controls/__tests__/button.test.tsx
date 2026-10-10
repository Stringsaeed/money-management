import { fireEvent, render, screen } from "@testing-library/react-native";

import { Button } from "../button";

describe("Button", () => {
  it("fires onPress and is labelled by its text", async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled and reports the disabled state", async () => {
    const onPress = jest.fn();
    await render(<Button disabled label="Save" onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Save" });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("blocks presses and reports busy while loading", async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" loading onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Save" });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
  });

  it("prefers an explicit accessibility label", async () => {
    await render(<Button accessibilityLabel="Save transaction" label="Save" />);
    expect(screen.getByRole("button", { name: "Save transaction" })).toBeTruthy();
  });

  it("gives the small size a hitSlop that reaches 44pt", async () => {
    await render(<Button label="Edit" size="sm" />);
    expect(screen.getByRole("button", { name: "Edit" }).props.hitSlop).toBe(4);
  });
});
