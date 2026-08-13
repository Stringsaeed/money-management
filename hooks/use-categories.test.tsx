import { act, waitFor } from "@testing-library/react-native";

import { categories } from "@/db/schema";
import {
  useCategories,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { createCategory } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-category-id"),
}));

jest.mock("@/utils/date", () => ({
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("use-categories hooks", () => {
  it("loads categories with an optional type filter", async () => {
    const db = createMockDb({
      selectResults: [{ all: [createCategory({ id: "category-1", type: "expense" })] }],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useCategories("expense"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([createCategory({ id: "category-1", type: "expense" })]);
  });

  it("loads a single category by id", async () => {
    const db = createMockDb({
      selectResults: [
        { get: createCategory({ id: "category-1", name: "Salary", type: "income" }) },
      ],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useCategory("category-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(
      createCategory({ id: "category-1", name: "Salary", type: "income" }),
    );
  });

  it("creates a category and invalidates the list", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useCreateCategory());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        name: "Salary",
        type: "income",
        color: "#8B9D83",
        icon: "💼",
        parentId: null,
        sortOrder: 0,
      });
    });

    expect(db.insert).toHaveBeenCalledWith(categories);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] });
  });

  it("updates a category and invalidates its detail query", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useUpdateCategory());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({
        id: "category-1",
        data: { name: "Dining" },
      });
    });

    expect(db.update).toHaveBeenCalledWith(categories);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories", "category-1"] });
  });

  it("deletes a category and invalidates the category list", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useDeleteCategory());
    const invalidateQueries = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync("category-1");
    });

    expect(db.delete).toHaveBeenCalledWith(categories);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] });
  });
});
