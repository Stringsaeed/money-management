import { fireEvent, render, screen } from "@testing-library/react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { CategoryEditorForm } from "../category-editor-form";

const legacy: V2Category = {
  id: "category-1",
  ledgerId: "personal:guest-1",
  name: "Food",
  kind: "expense",
  color: "#123456",
  icon: "receipt",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 2,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};

const press = (label: string) => fireEvent.press(screen.getByRole("button", { name: label }));

describe("CategoryEditorForm", () => {
  it("creates a category from the kind toggle, color row, and emoji grid", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<CategoryEditorForm onSubmit={onSubmit} />);

    await press("Income category");
    await press("Icon 💼");
    await press("Blue color");
    await fireEvent.changeText(screen.getByLabelText("Category name"), " Salary ");
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Salary",
      kind: "income",
      color: "#3b7dd8",
      icon: "💼",
    });
  });

  it("shows the emoji set for the selected kind", async () => {
    await render(<CategoryEditorForm onSubmit={jest.fn(() => Promise.resolve())} />);

    expect(screen.getByRole("button", { name: "Icon 🛒" })).toBeOnTheScreen();
    await press("Income category");
    expect(screen.queryByRole("button", { name: "Icon 🛒" })).not.toBeOnTheScreen();
  });

  it("asks for a name before saving", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<CategoryEditorForm onSubmit={onSubmit} />);

    await press("Save");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Name this category so it's easy to pick later.",
    );
  });

  it("keeps a custom color selectable and maps legacy icon slugs to the fallback emoji", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<CategoryEditorForm category={legacy} onSubmit={onSubmit} />);

    expect(screen.getByText("Edit category")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Current color" })).toBeSelected();
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Food",
      kind: "expense",
      color: "#123456",
      icon: "🏷️",
    });
  });
});
