import { fireEvent, render, screen } from "@testing-library/react-native";

import { CategoryPicker } from "@/components/category/category-picker";
import { createCategory } from "@/tests/test-utils/factories";

const mockUseCategories = jest.fn();

jest.mock("@/hooks/use-categories", () => ({
  useCategories: (...args: unknown[]) => mockUseCategories(...args),
}));

describe("CategoryPicker", () => {
  beforeEach(() => {
    mockUseCategories.mockReturnValue({
      data: [
        createCategory({ id: "category-1", name: "Groceries" }),
        createCategory({ id: "category-2", name: "Dining", color: "#F59E0B" }),
        createCategory({ id: "category-3", name: "Archived", lifecycle: "archived" }),
      ],
    });
  });

  it("toggles the selected category off in wrapped mode", async () => {
    const onChange = jest.fn();

    await render(
      <CategoryPicker value="category-1" onChange={onChange} type="expense" label="Category" />,
    );

    await fireEvent.press(screen.getByText("Groceries"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("supports horizontal mode and selects a new category", async () => {
    const onChange = jest.fn();

    await render(<CategoryPicker value={null} onChange={onChange} type="expense" horizontal />);

    await fireEvent.press(screen.getByText("Dining"));

    expect(onChange).toHaveBeenCalledWith("category-2");
  });

  it("excludes archived Categories from new selection", async () => {
    await render(<CategoryPicker value={null} onChange={jest.fn()} type="expense" />);

    expect(screen.queryByRole("button", { name: "Archived" })).not.toBeOnTheScreen();
  });
});
