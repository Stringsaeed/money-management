import { fireEvent, render, screen } from "@testing-library/react-native";

import { NoteInput } from "../note-input";

describe("NoteInput", () => {
  it("shows the note emoji and forwards edited text", async () => {
    const onChange = jest.fn();

    await render(<NoteInput value="" onChange={onChange} />);

    expect(screen.getByText("📝")).toBeOnTheScreen();

    const input = screen.getByPlaceholderText("Add a note...");
    fireEvent.changeText(input, "Groceries");
    expect(onChange).toHaveBeenCalledWith("Groceries");
  });

  it("renders the current description value", async () => {
    await render(<NoteInput value="Rent" onChange={jest.fn()} />);

    expect(screen.getByPlaceholderText("Add a note...").props.value).toBe("Rent");
  });

  it("exposes an accessibility label for the note field", async () => {
    await render(<NoteInput value="" onChange={jest.fn()} />);

    expect(screen.getByLabelText("Transaction note")).toBeOnTheScreen();
  });
});
