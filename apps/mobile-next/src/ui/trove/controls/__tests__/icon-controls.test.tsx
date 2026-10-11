import { fireEvent, render, screen } from "@testing-library/react-native";

import { IconButton } from "../icon-button";
import { QuickAction } from "../quick-action";

describe("IconButton", () => {
  it("is named by its accessibility label and fires onPress", async () => {
    const onPress = jest.fn();
    await render(<IconButton accessibilityLabel="Add" icon="add" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Add" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onPress = jest.fn();
    await render(<IconButton accessibilityLabel="Add" disabled icon="add" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Add" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("QuickAction", () => {
  it("uses the caption as its accessible name and fires onPress", async () => {
    const onPress = jest.fn();
    await render(<QuickAction icon="transfer" label="Move" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Move" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onPress = jest.fn();
    await render(<QuickAction disabled icon="transfer" label="Move" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Move" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
