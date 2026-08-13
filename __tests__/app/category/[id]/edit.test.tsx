import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EditCategoryScreen from "@/app/category/[id]/edit";
import { createCategory } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDeleteCategory = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/components/common/color-picker", () => ({
  ColorPicker: ({ onChange }: { onChange: (value: string) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChange("#EF4444") },
      React.createElement(Text, null, "pick-color"),
    );
  },
}));

jest.mock("@/components/common/emoji-picker", () => ({
  EmojiPicker: ({ onChange }: { onChange: (value: string) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return React.createElement(
      Pressable,
      { onPress: () => onChange("🎁") },
      React.createElement(Text, null, "pick-emoji"),
    );
  },
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategory: (...args: unknown[]) => mockUseCategory(...args),
  useUpdateCategory: () => ({ mutateAsync: mockUpdateCategory }),
  useDeleteCategory: () => ({ mutateAsync: mockDeleteCategory }),
}));

describe("app/category/[id]/edit", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ id: "category-1" });
    mockUseCategory.mockReturnValue({
      data: createCategory({ id: "category-1", name: "Groceries", icon: "🛒" }),
      isLoading: false,
    });
    mockUpdateCategory.mockResolvedValue(undefined);
    mockDeleteCategory.mockResolvedValue(undefined);
  });

  it("validates and saves category changes", async () => {
    await render(<EditCategoryScreen />);

    await fireEvent.changeText(screen.getByDisplayValue("Groceries"), " ");
    await fireEvent.press(screen.getByText("Save Changes"));
    expect(await screen.findByText("Category name is required")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByDisplayValue(" "), "Gifts");
    await fireEvent.press(screen.getByText("pick-emoji"));
    await fireEvent.press(screen.getByText("pick-color"));
    await fireEvent.press(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith({
        id: "category-1",
        data: { name: "Gifts", color: "#EF4444", icon: "🎁" },
      });
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it("confirms deletion", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    await render(<EditCategoryScreen />);

    await fireEvent.press(screen.getByText("Delete Category"));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.[1];
    await destructiveAction?.onPress?.();

    expect(mockDeleteCategory).toHaveBeenCalledWith("category-1");
    expect(mockBack).toHaveBeenCalled();
  });
});
