import { act, waitFor } from "@testing-library/react-native";

import { categories } from "@/db/schema";
import {
  useAllCategories,
  useArchiveCategory,
  useCategories,
  useCategory,
  useCategoryDeletionPreview,
  useCreateCategory,
  useDeleteCategory,
  useRestoreCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { createCategory } from "@/tests/test-utils/factories";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockUseSQLiteContext = jest.fn();
const mockCohereLedgerCache = jest.fn();
const mockArchiveCategory = jest.fn();
const mockDeleteCategory = jest.fn();
const mockPreviewCategoryDeletion = jest.fn();
const mockRestoreCategory = jest.fn();
const mockListServerCategories = jest.fn();

interface CoherenceAwareMutation<T> {
  expectPending: () => void;
  resolve: () => Promise<T>;
}

async function startMutationAwaitingCoherence<T>(
  startMutation: () => Promise<T>,
): Promise<CoherenceAwareMutation<T>> {
  let settleCoherence!: () => void;
  mockCohereLedgerCache.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        settleCoherence = resolve;
      }),
  );
  let mutationSettled = false;
  let mutation!: Promise<T>;

  await act(async () => {
    mutation = startMutation();
    mutation.then(() => {
      mutationSettled = true;
    });
  });

  return {
    expectPending: () => {
      expect(mutationSettled).toBe(false);
    },
    resolve: async () => {
      let value!: T;
      await act(async () => {
        settleCoherence();
        value = await mutation;
      });
      return value;
    },
  };
}

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    ledger: {
      accounts: { list: jest.fn() },
      categories: { list: (...args: unknown[]) => mockListServerCategories(...args) },
      transactions: { list: jest.fn() },
    },
    commands: { apply: jest.fn() },
    sync: { getDelta: jest.fn() },
  },
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockUseSQLiteContext(),
}));

jest.mock("@/modules/categories/category-lifecycle", () => ({
  archiveCategory: (...args: unknown[]) => mockArchiveCategory(...args),
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  previewCategoryDeletion: (...args: unknown[]) => mockPreviewCategoryDeletion(...args),
  restoreCategory: (...args: unknown[]) => mockRestoreCategory(...args),
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-category-id"),
}));

jest.mock("@/utils/date", () => ({
  ...jest.requireActual("@/utils/date"),
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("use-categories hooks", () => {
  beforeEach(() => {
    mockUseSQLiteContext.mockReturnValue({ raw: "database" });
    mockArchiveCategory.mockResolvedValue(undefined);
    mockDeleteCategory.mockResolvedValue(undefined);
    mockPreviewCategoryDeletion.mockResolvedValue({
      categoryId: "category-1",
      transactionCount: 0,
      recurringRuleCount: 0,
      mappingCount: 0,
      childCount: 0,
      canDelete: true,
    });
    mockRestoreCategory.mockResolvedValue(undefined);
    mockCohereLedgerCache.mockResolvedValue(undefined);
  });

  it("loads categories with an optional type filter", async () => {
    const db = createMockDb({
      selectResults: [{ all: [createCategory({ id: "category-1", type: "expense" })] }],
    });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useCategories("expense"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.source).toBe("local");
    expect(result.current.data).toEqual([createCategory({ id: "category-1", type: "expense" })]);
  });

  it("loads the same Category shape from an explicitly synced source", async () => {
    const db = createMockDb({
      selectResults: [{ all: [createCategory({ id: "local-category", name: "Local" })] }],
    });
    mockUseDatabase.mockReturnValue(db);
    mockListServerCategories.mockResolvedValue([
      {
        householdId: "household-1",
        id: "category-1",
        name: "Groceries",
        type: "expense",
        color: "#B48A7B",
        icon: "🛒",
        parentId: null,
        sortOrder: 0,
        lifecycle: "active",
        lifecycleChangedAt: null,
        version: 0,
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: new Date("2026-03-28T10:00:00.000Z"),
        updatedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ]);

    const { result } = await renderHookWithProviders(() => useCategories("expense"), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([createCategory({ id: "category-1" })]);
    expect(db.select).not.toHaveBeenCalled();
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

  it("loads every Category lifecycle for management", async () => {
    const archived = createCategory({ id: "category-archived", lifecycle: "archived" });
    const db = createMockDb({ selectResults: [{ all: [archived] }] });
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useAllCategories());

    await waitFor(() => {
      expect(result.current.data).toEqual([archived]);
    });
  });

  it("reports a Category creation and waits for cache coherence", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useCreateCategory());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync({
        name: "Salary",
        type: "income",
        color: "#8B9D83",
        icon: "💼",
        parentId: null,
        sortOrder: 0,
      }),
    );

    expect(db.insert).toHaveBeenCalledWith(categories);
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "category.created",
        id: "generated-category-id",
      });
    });
    mutation.expectPending();
    await expect(mutation.resolve()).resolves.toBe("generated-category-id");
  });

  it("reports a Category update after the write commits", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useUpdateCategory());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync({
        id: "category-1",
        data: { name: "Dining" },
      }),
    );

    expect(db.update).toHaveBeenCalledWith(categories);
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "category.updated",
        id: "category-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });

  it("reports a Category deletion after the write commits", async () => {
    const { result, client } = await renderHookWithProviders(() => useDeleteCategory());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("category-1"),
    );

    expect(mockDeleteCategory).toHaveBeenCalledWith({ raw: "database" }, "category-1");
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "category.deleted",
        id: "category-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });

  it("previews permanent deletion eligibility from durable dependencies", async () => {
    const { result } = await renderHookWithProviders(() =>
      useCategoryDeletionPreview("category-1"),
    );

    await waitFor(() => {
      expect(result.current.data?.canDelete).toBe(true);
    });
    expect(mockPreviewCategoryDeletion).toHaveBeenCalledWith({ raw: "database" }, "category-1");
  });

  it.each([
    {
      label: "archive",
      useLifecycleMutation: useArchiveCategory,
      command: mockArchiveCategory,
      change: { kind: "category.archived", id: "category-1" },
      expectedRequest: {
        categoryId: "category-1",
        localDate: expect.any(String),
        now: expect.any(String),
      },
    },
    {
      label: "restore",
      useLifecycleMutation: useRestoreCategory,
      command: mockRestoreCategory,
      change: { kind: "category.restored", id: "category-1" },
      expectedRequest: {
        categoryId: "category-1",
        now: "2026-03-28T12:00:00.000Z",
      },
    },
  ])(
    "reports a Category $label after the lifecycle write commits",
    async ({ useLifecycleMutation, command, change, expectedRequest }) => {
      const { result, client } = await renderHookWithProviders(() => useLifecycleMutation());
      const mutation = await startMutationAwaitingCoherence(() =>
        result.current.mutateAsync("category-1"),
      );

      expect(command).toHaveBeenCalledWith({ raw: "database" }, expectedRequest);
      await waitFor(() => {
        expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, change);
      });
      mutation.expectPending();
      await mutation.resolve();
    },
  );

  it("derives the archive period and timestamp from one month-boundary instant", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 1, 0, 0, 0));
    try {
      const { result } = await renderHookWithProviders(() => useArchiveCategory());

      await act(async () => {
        await result.current.mutateAsync("category-1");
      });

      expect(mockArchiveCategory).toHaveBeenLastCalledWith(
        { raw: "database" },
        {
          categoryId: "category-1",
          localDate: "2026-09-01",
          now: new Date(2026, 8, 1, 0, 0, 0).toISOString(),
        },
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
