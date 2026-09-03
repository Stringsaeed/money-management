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
import { createTestQueryClient, renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockUseSQLiteContext = jest.fn();
const mockCohereLedgerCache = jest.fn();
const mockArchiveCategory = jest.fn();
const mockDeleteCategory = jest.fn();
const mockPreviewCategoryDeletion = jest.fn();
const mockRestoreCategory = jest.fn();
const mockListServerCategories = jest.fn();
const mockListServerAccounts = jest.fn();
const mockListServerTransactions = jest.fn();
const mockEnqueueCommand = jest.fn();
const mockListProjectableCommands = jest.fn();
const mockApply = jest.fn();
const mockReadSnapshot = jest.fn();
const mockWriteSnapshot = jest.fn();

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
      accounts: { list: (...args: unknown[]) => mockListServerAccounts(...args) },
      categories: { list: (...args: unknown[]) => mockListServerCategories(...args) },
      transactions: { list: (...args: unknown[]) => mockListServerTransactions(...args) },
    },
    commands: { apply: (...args: unknown[]) => mockApply(...args) },
    sync: { getDelta: jest.fn() },
  },
}));

jest.mock("@/lib/sync/outbox", () => ({
  ...jest.requireActual("@/lib/sync/outbox"),
  enqueueCommand: (...args: unknown[]) => mockEnqueueCommand(...args),
  listProjectableCommands: (...args: unknown[]) => mockListProjectableCommands(...args),
}));

jest.mock("@/modules/ledger-data-source/synced-transaction-snapshot", () => ({
  readSyncedTransactionSnapshot: (...args: unknown[]) => mockReadSnapshot(...args),
  writeSyncedTransactionSnapshot: (...args: unknown[]) => mockWriteSnapshot(...args),
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
    mockEnqueueCommand.mockResolvedValue(undefined);
    mockListProjectableCommands.mockResolvedValue([]);
    mockReadSnapshot.mockRejectedValue(
      new Error("No authoritative synced Transaction snapshot is cached for this household."),
    );
    mockWriteSnapshot.mockResolvedValue(undefined);
    mockListServerAccounts.mockResolvedValue([]);
    mockListServerTransactions.mockResolvedValue({ transactions: [], hasMore: false });
    mockApply.mockResolvedValue({
      kind: "applied",
      seq: 1,
      effects: [],
      applied: {},
      replayed: false,
    });
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

  it("isolates Category caches across local mode and same-household users", async () => {
    const client = createTestQueryClient();
    const localDb = createMockDb({
      selectResults: [{ all: [createCategory({ id: "local-category", name: "Local" })] }],
    });
    mockUseDatabase.mockReturnValue(localDb);
    const local = await renderHookWithProviders(() => useCategories("expense"), { client });
    await waitFor(() => expect(local.result.current.isSuccess).toBe(true));
    client.setQueryData(["categories", "expense", "local-only"], local.result.current.data);
    await local.unmount();

    mockListServerCategories.mockResolvedValue([
      {
        householdId: "household-1",
        ...createCategory({ id: "synced-category", name: "Synced" }),
        version: 0,
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: new Date("2026-03-28T10:00:00.000Z"),
        updatedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ]);
    const synced = await renderHookWithProviders(() => useCategories("expense"), {
      client,
      ledgerSelection: { kind: "synced", householdId: "household-1", userId: "user-1" },
    });

    await waitFor(() =>
      expect(synced.result.current.data).toMatchObject([{ id: "synced-category" }]),
    );
    expect(mockListServerCategories).toHaveBeenCalled();
    expect(
      client.getQueryData(["categories", "expense", "synced:household-1:user-1"]),
    ).toMatchObject([{ id: "synced-category" }]);
    await synced.unmount();

    mockListServerCategories.mockRejectedValue(new Error("offline"));
    const otherUser = await renderHookWithProviders(() => useCategories("expense"), {
      client,
      ledgerSelection: { kind: "synced", householdId: "household-1", userId: "user-2" },
    });
    await waitFor(() => expect(otherUser.result.current.isError).toBe(true));
    expect(otherUser.result.current.data).toBeUndefined();
    expect(
      client.getQueryData(["categories", "expense", "synced:household-1:user-2"]),
    ).toBeUndefined();
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

  it("shows a queued synced create in pickers without applying", async () => {
    mockListServerCategories.mockResolvedValue([]);
    mockListProjectableCommands.mockResolvedValue([
      {
        commandId: "command-create",
        householdId: "household-1",
        kind: "category.create",
        payload: {
          id: "dining",
          name: "Dining",
          type: "expense",
          color: "#B48A7B",
          icon: "🍽️",
          parentId: null,
          sortOrder: 0,
        },
        issuedAt: "2026-03-28T12:00:00.000Z",
        status: "pending",
      },
    ]);
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useCategories("expense"), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: "dining",
        name: "Dining",
        type: "expense",
      }),
    ]);
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("enqueues a synced create instead of applying or writing sqlite categories", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useCreateCategory(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

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

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        kind: "category.create",
        userId: "test-user",
      }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalledWith(categories);
  });

  it("enqueues a synced update with the cached version precondition", async () => {
    mockReadSnapshot.mockResolvedValue({
      householdId: "household-1",
      userId: "test-user",
      accounts: [],
      categories: [
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
          version: 3,
          createdBy: "test-user",
          updatedBy: "test-user",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
      transactions: [],
    });
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useUpdateCategory(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "category-1",
        data: { name: "Dining", sortOrder: 4 },
      });
    });

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        kind: "category.update",
        payload: { categoryId: "category-1", name: "Dining", sortOrder: 4 },
        preconditions: [{ entityId: "category-1", expectedVersion: 3 }],
      }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalledWith(categories);
  });

  it("enqueues a synced archive instead of applying", async () => {
    mockReadSnapshot.mockResolvedValue({
      householdId: "household-1",
      userId: "test-user",
      accounts: [],
      categories: [
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
          version: 3,
          createdBy: "test-user",
          updatedBy: "test-user",
          createdAt: "2026-03-28T10:00:00.000Z",
          updatedAt: "2026-03-28T10:00:00.000Z",
        },
      ],
      transactions: [],
    });
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useArchiveCategory(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await act(async () => {
      await result.current.mutateAsync("category-1");
    });

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        kind: "category.archive",
        payload: { categoryId: "category-1" },
        preconditions: [{ entityId: "category-1", expectedVersion: 3 }],
      }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockArchiveCategory).not.toHaveBeenCalled();
  });

  it("throws on synced restore instead of enqueueing a protocol kind", async () => {
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result } = await renderHookWithProviders(() => useRestoreCategory(), {
      ledgerSelection: { kind: "synced", householdId: "household-1" },
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync("category-1");
      }),
    ).rejects.toThrow("unavailable for the synced ledger");
    expect(mockEnqueueCommand).not.toHaveBeenCalled();
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockRestoreCategory).not.toHaveBeenCalled();
  });
});
