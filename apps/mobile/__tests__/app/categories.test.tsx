import { Alert } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import CategoriesScreen from "@/app/categories";
import { createCategory } from "@/tests/test-utils/factories";

const mockActiveWithHistory = createCategory({ id: "category-used", name: "Dining" });
const mockActiveUnused = createCategory({ id: "category-unused", name: "Unused" });
const mockArchived = createCategory({
  id: "category-archived",
  name: "Old Groceries",
  lifecycle: "archived",
});

const mockArchiveCategory = jest.fn();
const mockCreateCategory = jest.fn();
const mockDeleteCategory = jest.fn();
const mockRestoreCategory = jest.fn();
const mockUpdateCategory = jest.fn();

jest.mock("@/hooks/use-categories", () => ({
  useAllCategories: () => ({ data: [mockActiveWithHistory, mockActiveUnused, mockArchived] }),
  useArchiveCategory: () => ({ mutateAsync: mockArchiveCategory }),
  useCategoryDeletionPreview: (id: string) => ({
    data: { canDelete: id === "category-unused" },
    isSuccess: true,
  }),
  useCreateCategory: () => ({ mutateAsync: mockCreateCategory }),
  useDeleteCategory: () => ({ mutateAsync: mockDeleteCategory }),
  useRestoreCategory: () => ({ mutateAsync: mockRestoreCategory }),
  useUpdateCategory: () => ({ mutateAsync: mockUpdateCategory }),
}));

describe("app/categories", () => {
  beforeEach(() => {
    mockArchiveCategory.mockResolvedValue(undefined);
    mockCreateCategory.mockResolvedValue(undefined);
    mockDeleteCategory.mockResolvedValue(undefined);
    mockRestoreCategory.mockResolvedValue(undefined);
    mockUpdateCategory.mockResolvedValue(undefined);
  });

  it("offers Archive instead of permanent Delete for a Category with history", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await render(<CategoriesScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Dining" }));

    expect(screen.getByRole("button", { name: "Archive Dining" })).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Permanently delete Dining" }),
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Archive Dining" }));
    const archiveAction = alert.mock.calls[0]?.[2]?.find((button) => button.text === "Archive");
    await act(async () => {
      await archiveAction?.onPress?.();
    });

    expect(mockArchiveCategory).toHaveBeenCalledWith("category-used");
  });

  it("restores an archived Category without presenting an Archive action", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await render(<CategoriesScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Old Groceries, Archived" }));

    expect(screen.getByRole("button", { name: "Restore Old Groceries" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Archive Old Groceries" })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Restore Old Groceries" }));
    expect(alert.mock.calls[0]?.[1]).toContain("future Envelope mappings stay ended");
    const restoreAction = alert.mock.calls[0]?.[2]?.find((button) => button.text === "Restore");
    await act(async () => {
      await restoreAction?.onPress?.();
    });

    expect(mockRestoreCategory).toHaveBeenCalledWith("category-archived");
  });

  it("offers permanent Delete only for a Category without dependent history", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await render(<CategoriesScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Unused" }));
    await fireEvent.press(screen.getByRole("button", { name: "Permanently delete Unused" }));
    const deleteAction = alert.mock.calls[0]?.[2]?.find(
      (button) => button.text === "Delete Permanently",
    );
    await act(async () => {
      await deleteAction?.onPress?.();
    });

    expect(mockDeleteCategory).toHaveBeenCalledWith("category-unused");
  });
});
