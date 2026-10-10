import { fireEvent, render, screen } from "@testing-library/react-native";

import { Avatar } from "../../identity";
import { Header } from "../header";
import { largeTitleVariant } from "../utils";

describe("Header", () => {
  it("renders a large title with labelled actions", async () => {
    const onSearch = jest.fn();
    await render(
      <Header
        actions={[{ icon: "search", label: "Search", onPress: onSearch }]}
        title="Activity"
      />,
    );
    expect(screen.getByRole("header", { name: "Activity" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("shows a back button in the compact bar only when given a handler", async () => {
    const onBack = jest.fn();
    const { rerender } = await render(<Header title="Groceries" variant="compact" />);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    await rerender(<Header onBack={onBack} title="Groceries" variant="compact" />);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the leading slot, stamp and a primary action", async () => {
    const onAdd = jest.fn();
    await render(
      <Header
        leading={<Avatar accessibilityLabel="Profile" initials="AB" />}
        primaryAction={{ label: "Add", icon: "add", onPress: onAdd }}
        stamp="SAT 10.10.26"
        title="Accounts"
      />,
    );
    expect(screen.getByLabelText("Profile")).toBeTruthy();
    expect(screen.getByText("SAT 10.10.26")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("does not fire a disabled action and reports it as disabled", async () => {
    const onSave = jest.fn();
    const onDelete = jest.fn();
    await render(
      <Header
        actions={[
          { icon: "trash", label: "Delete", onPress: onDelete, tone: "negative" },
          { icon: "check", label: "Save", onPress: onSave, disabled: true },
        ]}
        title="Edit entry"
      />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    expect(save.props.accessibilityState).toEqual({ disabled: true });
    await fireEvent.press(save);
    expect(onSave).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("supports disabled and negative actions in the compact bar", async () => {
    const onSave = jest.fn();
    await render(
      <Header
        actions={[{ icon: "check", label: "Save", onPress: onSave, disabled: true }]}
        title="Edit"
        variant="compact"
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("largeTitleVariant", () => {
  it("keeps display for plain headers and steps down for slotted ones", () => {
    expect(largeTitleVariant(false)).toBe("display");
    expect(largeTitleVariant(true)).toBe("titleLg");
  });
});
