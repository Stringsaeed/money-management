import { fireEvent, render, screen } from "@testing-library/react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { USER_COLOR_SWATCHES } from "@/ui/trove";

import { initialCategoryDraft } from "../category-draft";
import { DEFAULT_CATEGORY_COLOR } from "../category-palette";
import { CategoryEditorForm } from "../category-editor-form";

const legacyCategory: V2Category = {
  id: "c1",
  ledgerId: "l1",
  name: "Groceries",
  kind: "expense",
  color: "#4a8f69",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("category draft", () => {
  it("starts new categories on a Trove palette colour", () => {
    const draft = initialCategoryDraft(undefined);
    expect(USER_COLOR_SWATCHES.map((swatch) => swatch.hex)).toContain(DEFAULT_CATEGORY_COLOR);
    expect(draft.color).toBe(DEFAULT_CATEGORY_COLOR);
  });

  it("keeps a colour saved with the older palette", () => {
    expect(initialCategoryDraft(legacyCategory).color).toBe("#4a8f69");
  });
});

describe("CategoryEditorForm", () => {
  it("saves the typed name with the picked colour and emoji", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<CategoryEditorForm onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByPlaceholderText("Category name"), "Dining out");
    await fireEvent.press(screen.getByRole("radio", { name: "Orange" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Coffee" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Dining out",
      kind: "expense",
      color: "#EB6834",
      icon: "☕",
    });
  });

  it("refuses to save without a name", async () => {
    const onSubmit = jest.fn();
    await render(<CategoryEditorForm onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("switches the emoji set when the kind changes", async () => {
    await render(<CategoryEditorForm onSubmit={jest.fn()} />);
    expect(screen.getByRole("radio", { name: "Groceries" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("togglebutton", { name: "Income" }));
    expect(screen.getByRole("radio", { name: "Salary" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Groceries" })).toBeNull();
  });
});
