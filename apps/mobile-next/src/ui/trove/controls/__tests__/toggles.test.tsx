import { fireEvent, render, screen } from "@testing-library/react-native";

import { Checkbox } from "../checkbox";
import { Switch } from "../switch";

describe("Switch", () => {
  it("exposes the switch role and checked state", async () => {
    await render(<Switch accessibilityLabel="Round up" onValueChange={jest.fn()} value />);
    const toggle = screen.getByRole("switch", { name: "Round up" });
    expect(toggle.props.accessibilityState).toMatchObject({ checked: true });
  });

  it("toggles to the opposite value", async () => {
    const onValueChange = jest.fn();
    await render(
      <Switch accessibilityLabel="Round up" onValueChange={onValueChange} value={false} />,
    );
    await fireEvent.press(screen.getByRole("switch", { name: "Round up" }));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("ignores presses when disabled", async () => {
    const onValueChange = jest.fn();
    await render(
      <Switch accessibilityLabel="Round up" disabled onValueChange={onValueChange} value />,
    );
    await fireEvent.press(screen.getByRole("switch", { name: "Round up" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Checkbox", () => {
  it("exposes the checkbox role, label and checked state", async () => {
    await render(<Checkbox checked label="Hide balances" onCheckedChange={jest.fn()} />);
    const box = screen.getByRole("checkbox", { name: "Hide balances" });
    expect(box.props.accessibilityState).toMatchObject({ checked: true });
  });

  it("toggles to the opposite value", async () => {
    const onCheckedChange = jest.fn();
    await render(
      <Checkbox checked={false} label="Hide balances" onCheckedChange={onCheckedChange} />,
    );
    await fireEvent.press(screen.getByRole("checkbox", { name: "Hide balances" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("works without a visible label when given an accessibility label", async () => {
    const onCheckedChange = jest.fn();
    await render(
      <Checkbox accessibilityLabel="Select row" checked onCheckedChange={onCheckedChange} />,
    );
    await fireEvent.press(screen.getByRole("checkbox", { name: "Select row" }));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("ignores presses when disabled", async () => {
    const onCheckedChange = jest.fn();
    await render(
      <Checkbox checked disabled label="Hide balances" onCheckedChange={onCheckedChange} />,
    );
    await fireEvent.press(screen.getByRole("checkbox", { name: "Hide balances" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
