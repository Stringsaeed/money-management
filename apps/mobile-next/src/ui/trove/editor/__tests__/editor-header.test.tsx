import { fireEvent, render, screen } from "@testing-library/react-native";

import { EditorHeader } from "../editor-header";

describe("EditorHeader", () => {
  it("New: title, close and save, no trash", async () => {
    await render(<EditorHeader onClose={jest.fn()} onSave={jest.fn()} title="New entry" />);
    expect(screen.getByRole("header", { name: "New entry" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete entry" })).toBeNull();
  });

  it("Edit: adds the trash disc", async () => {
    const onDelete = jest.fn();
    await render(
      <EditorHeader
        onClose={jest.fn()}
        onDelete={onDelete}
        onSave={jest.fn()}
        title="Edit entry"
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Delete entry" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("Invalid: save is disabled and ignores presses", async () => {
    const onSave = jest.fn();
    await render(
      <EditorHeader onClose={jest.fn()} onSave={onSave} saveDisabled title="New entry" />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await fireEvent.press(save);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("closes and saves", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    await render(<EditorHeader onClose={onClose} onSave={onSave} title="New entry" />);
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
