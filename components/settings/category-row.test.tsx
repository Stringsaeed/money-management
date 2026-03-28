import { fireEvent, render, screen } from "@testing-library/react-native";

import { CategoryRow } from "@/components/settings/category-row";
import { createCategory } from "@/tests/test-utils/factories";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

describe("CategoryRow", () => {
  it("renders category details and routes to edit", () => {
    render(<CategoryRow category={createCategory({ id: "category-1", name: "Groceries" })} />);

    fireEvent.press(screen.getByText("Groceries"));

    expect(mockPush).toHaveBeenCalledWith("/category/category-1/edit");
  });
});
