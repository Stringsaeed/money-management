import { fireEvent, render, screen } from "@testing-library/react-native";

import { SearchField } from "../search-field";
import { TextField } from "../text-field";

describe("TextField", () => {
  it("shows the label and reports typing", async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Pot name" onChangeText={onChangeText} value="" />);
    expect(screen.getByText("Pot name")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Pot name"), "Holiday");
    expect(onChangeText).toHaveBeenCalledWith("Holiday");
  });

  it("shows the error message and flags the input invalid", async () => {
    await render(
      <TextField
        error="You already have a pot called Holiday"
        label="Pot name"
        onChangeText={jest.fn()}
        value="Holiday"
      />,
    );
    expect(screen.getByText("You already have a pot called Holiday")).toBeTruthy();
    expect(screen.getByLabelText("Pot name").props["aria-invalid"]).toBe(true);
  });

  it("is not editable when disabled", async () => {
    await render(
      <TextField disabled label="Account number" onChangeText={jest.fn()} value="4021" />,
    );
    expect(screen.getByLabelText("Account number").props.editable).toBe(false);
  });

  it("forwards focus and blur to the caller", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <TextField
        label="Pot name"
        onBlur={onBlur}
        onChangeText={jest.fn()}
        onFocus={onFocus}
        value=""
      />,
    );
    const input = screen.getByLabelText("Pot name");
    await fireEvent(input, "focus");
    await fireEvent(input, "blur");
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

describe("SearchField", () => {
  it("is labelled by its placeholder and reports typing", async () => {
    const onChangeText = jest.fn();
    await render(
      <SearchField onChangeText={onChangeText} placeholder="Search transactions" value="" />,
    );
    await fireEvent.changeText(screen.getByLabelText("Search transactions"), "rent");
    expect(onChangeText).toHaveBeenCalledWith("rent");
  });

  it("offers a clear button only while it holds text", async () => {
    const onChangeText = jest.fn();
    const { rerender } = await render(
      <SearchField onChangeText={onChangeText} placeholder="Search" value="" />,
    );
    expect(screen.queryByLabelText("Clear search")).toBeNull();
    await rerender(<SearchField onChangeText={onChangeText} placeholder="Search" value="rent" />);
    await fireEvent.press(screen.getByLabelText("Clear search"));
    expect(onChangeText).toHaveBeenCalledWith("");
  });
});
