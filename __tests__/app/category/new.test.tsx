import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import NewCategoryScreen from "@/app/category/new";

const mockBack = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
}));

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: () => null,
}));

jest.mock("@/components/common/emoji-picker", () => ({
  EmojiPicker: () => null,
}));

jest.mock("@/hooks/use-categories", () => ({
  useCreateCategory: () => ({
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
  }),
}));

describe("app/category/new", () => {
  beforeEach(() => {
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it("validates the category name", async () => {
    await render(<NewCategoryScreen />);

    await fireEvent.press(screen.getByText("Create Category"));

    expect(await screen.findByText("Category name is required")).toBeOnTheScreen();
  });

  it("creates a category and navigates back", async () => {
    await render(<NewCategoryScreen />);

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Bills");
    await fireEvent.press(screen.getByText("Create Category"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(mockBack).toHaveBeenCalled();
  });
});
