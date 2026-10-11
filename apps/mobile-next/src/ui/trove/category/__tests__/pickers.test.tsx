import { fireEvent, render, screen } from "@testing-library/react-native";

import { CategoryPreview } from "../category-preview";
import { EmojiGrid } from "../emoji-grid";
import { SwatchPicker } from "../swatch-picker";

const OPTIONS = [
  { glyph: "🍽️", name: "Dining" },
  { glyph: "☕", name: "Coffee" },
  { glyph: "🍔", name: "Fast food" },
  { glyph: "🛒", name: "Groceries" },
  { glyph: "🍕", name: "Pizza" },
  { glyph: "🥐", name: "Bakery" },
  { glyph: "🍣", name: "Sushi" },
];

describe("SwatchPicker", () => {
  it("is a radiogroup of nine named radios with one checked", async () => {
    await render(<SwatchPicker onChange={jest.fn()} value="#eb6834" />);
    expect(screen.getByLabelText("Colour").props.accessibilityRole).toBe("radiogroup");
    expect(screen.getAllByRole("radio")).toHaveLength(9);
    expect(screen.getByRole("radio", { name: "Orange", checked: true })).toBeTruthy();
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Blue", checked: false })).toBeTruthy();
  });

  it("reports the swatch hex on press", async () => {
    const onChange = jest.fn();
    await render(<SwatchPicker onChange={onChange} />);
    await fireEvent.press(screen.getByRole("radio", { name: "Teal" }));
    expect(onChange).toHaveBeenCalledWith("#14A3A3");
    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
  });
});

describe("EmojiGrid", () => {
  it("is a radiogroup with the chosen emoji checked", async () => {
    await render(<EmojiGrid color="#EB6834" onChange={jest.fn()} options={OPTIONS} value="☕" />);
    expect(screen.getByLabelText("Emoji").props.accessibilityRole).toBe("radiogroup");
    expect(screen.getAllByRole("radio")).toHaveLength(7);
    expect(screen.getByRole("radio", { name: "Coffee", checked: true })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Dining", checked: false })).toBeTruthy();
  });

  it("reports the glyph on press", async () => {
    const onChange = jest.fn();
    await render(<EmojiGrid onChange={onChange} options={OPTIONS} />);
    await fireEvent.press(screen.getByRole("radio", { name: "Sushi" }));
    expect(onChange).toHaveBeenCalledWith("🍣");
  });
});

describe("CategoryPreview", () => {
  it("reads the name and the palette colour name, hiding the emoji disc", async () => {
    await render(<CategoryPreview color="#3E4CF0" emoji="🛒" name="Groceries" />);
    expect(screen.getByText("Groceries")).toBeTruthy();
    expect(screen.getByText("Blue")).toBeTruthy();
    expect(screen.queryByText("🛒")).toBeNull();
    expect(screen.getByText("🛒", { includeHiddenElements: true })).toBeTruthy();
  });

  it("prefers an explicit stamp", async () => {
    await render(<CategoryPreview color="#3E4CF0" emoji="🛒" name="Groceries" stamp="Custom" />);
    expect(screen.getByText("Custom")).toBeTruthy();
  });
});
