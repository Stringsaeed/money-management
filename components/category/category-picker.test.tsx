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
      ],
    });
  });

  it("toggles the selected category off in wrapped mode", () => {
    const onChange = jest.fn();

    render(
      <CategoryPicker value="category-1" onChange={onChange} type="expense" label="Category" />,
    );

    fireEvent.press(screen.getByText("Groceries"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("supports horizontal mode and selects a new category", () => {
    const onChange = jest.fn();

    render(<CategoryPicker value={null} onChange={onChange} type="expense" horizontal />);

    fireEvent.press(screen.getByText("Dining"));

    expect(onChange).toHaveBeenCalledWith("category-2");
  });
});
