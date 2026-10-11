import { fireEvent, render, screen } from "@testing-library/react-native";

import { Dialog } from "../dialog";

const renderDialog = (overrides: Partial<Parameters<typeof Dialog>[0]> = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  return {
    onConfirm,
    onCancel,
    element: (
      <Dialog
        confirmLabel="Delete pot"
        message="The $900 inside moves back to Main account."
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Delete Holiday pot?"
        visible
        {...overrides}
      />
    ),
  };
};

describe("Dialog", () => {
  it("is announced as a modal alert dialog", async () => {
    await render(renderDialog().element);
    const dialog = screen.getByLabelText("Delete Holiday pot?");
    expect(dialog.props.accessibilityViewIsModal).toBe(true);
    expect(dialog.props.role).toBe("alertdialog");
  });

  it("confirms", async () => {
    const { element, onConfirm, onCancel } = renderDialog({ destructive: true });
    await render(element);
    await fireEvent.press(screen.getByRole("button", { name: "Delete pot" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels", async () => {
    const { element, onConfirm, onCancel } = renderDialog();
    await render(element);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders nothing when hidden", async () => {
    await render(renderDialog({ visible: false }).element);
    expect(screen.queryByLabelText("Delete Holiday pot?")).toBeNull();
  });
});
