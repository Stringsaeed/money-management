import { fireEvent, render, screen } from "@testing-library/react-native";

import { CreateActionSheet } from "../create-action-sheet";

describe("CreateActionSheet", () => {
  it.each([
    ["Transaction", "transaction"],
    ["Account", "account"],
    ["Category", "category"],
  ] as const)("selects %s creation", async (label, action) => {
    const onSelect = jest.fn();

    await render(<CreateActionSheet open onDismiss={jest.fn()} onSelect={onSelect} />);
    await fireEvent.press(screen.getByRole("button", { name: label }));

    expect(onSelect).toHaveBeenCalledWith(action);
  });
});
