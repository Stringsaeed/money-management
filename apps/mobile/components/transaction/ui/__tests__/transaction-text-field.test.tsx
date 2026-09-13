import { fireEvent, render, screen } from "@testing-library/react-native";

import { TransactionTextField } from "../transaction-text-field";

describe("TransactionTextField", () => {
  it("renders the current value and forwards typed text", async () => {
    const onChangeText = jest.fn();

    await render(
      <TransactionTextField
        value="Coffee"
        onChangeText={onChangeText}
        placeholder="Add a note..."
      />,
    );

    const input = screen.getByPlaceholderText("Add a note...");
    expect(input.props.value).toBe("Coffee");

    fireEvent.changeText(input, "Coffee with Sam");
    expect(onChangeText).toHaveBeenCalledWith("Coffee with Sam");
  });

  it("paints an ink border while focused and reverts to transparent on blur", async () => {
    await render(
      <TransactionTextField
        value=""
        onChangeText={jest.fn()}
        placeholder="Add a note..."
        testID="note-field"
      />,
    );

    const input = screen.getByPlaceholderText("Add a note...");
    expect(screen.getByTestId("note-field").props.className).toContain("border-transparent");

    await fireEvent(input, "focus");
    expect(screen.getByTestId("note-field").props.className).toContain("border-ink");

    await fireEvent(input, "blur");
    expect(screen.getByTestId("note-field").props.className).toContain("border-transparent");
  });

  it("paints a destructive border when marked invalid", async () => {
    await render(
      <TransactionTextField value="" onChangeText={jest.fn()} error testID="note-field" />,
    );

    expect(screen.getByTestId("note-field").props.className).toContain("border-destructive");
  });

  it("dims and stops accepting edits when not editable", async () => {
    await render(
      <TransactionTextField
        value=""
        onChangeText={jest.fn()}
        editable={false}
        placeholder="Add a note..."
        testID="note-field"
      />,
    );

    expect(screen.getByPlaceholderText("Add a note...").props.editable).toBe(false);
    expect(screen.getByTestId("note-field").props.className).toContain("opacity-50");
  });

  it("notifies focus and blur callbacks", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    await render(
      <TransactionTextField
        value=""
        onChangeText={jest.fn()}
        placeholder="Add a note..."
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    const input = screen.getByPlaceholderText("Add a note...");
    await fireEvent(input, "focus");
    expect(onFocus).toHaveBeenCalled();
    await fireEvent(input, "blur");
    expect(onBlur).toHaveBeenCalled();
  });

  it("preserves accessibility label, keyboard, and submit wiring", async () => {
    const onSubmitEditing = jest.fn();

    await render(
      <TransactionTextField
        value=""
        onChangeText={jest.fn()}
        placeholder="Add a note..."
        accessibilityLabel="Transaction note"
        keyboardType="default"
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        testID="note-field"
      />,
    );

    expect(screen.getByLabelText("Transaction note")).toBeOnTheScreen();
    expect(screen.getByTestId("note-field").props.accessibilityLabel).toBe("Transaction note");

    const input = screen.getByPlaceholderText("Add a note...");
    expect(input.props.keyboardType).toBe("default");
    expect(input.props.autoCapitalize).toBe("sentences");
    expect(input.props.returnKeyType).toBe("done");

    fireEvent(input, "submitEditing", { nativeEvent: { text: "Done typing" } });
    expect(onSubmitEditing).toHaveBeenCalledWith("Done typing");
  });
});
