import { fireEvent, render, screen } from "@testing-library/react-native";

import { Chip } from "../chip";

describe("Chip", () => {
  it("toggles through onPress and exposes the selected state", async () => {
    const onPress = jest.fn();
    await render(<Chip label="Spending" onPress={onPress} selected />);
    const chip = screen.getByRole("button", { name: "Spending" });
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no remove affordance by default", async () => {
    await render(<Chip label="Income" onPress={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "Remove Income" })).toBeNull();
  });

  it("removes without toggling", async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await render(<Chip label="Transfers" onPress={onPress} onRemove={onRemove} selected />);
    await fireEvent.press(screen.getByRole("button", { name: "Remove Transfers" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
