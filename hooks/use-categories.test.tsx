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
const mockCohereLedgerCache = jest.fn();

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

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-category-id"),
}));

jest.mock("@/utils/date", () => ({
  nowIso: jest.fn(() => "2026-03-28T12:00:00.000Z"),
}));

describe("use-categories hooks", () => {
  beforeEach(() => {
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
    const db = createMockDb();
    mockUseDatabase.mockReturnValue(db);

    const { result, client } = await renderHookWithProviders(() => useDeleteCategory());
    const mutation = await startMutationAwaitingCoherence(() =>
      result.current.mutateAsync("category-1"),
    );

    expect(db.delete).toHaveBeenCalledWith(categories);
    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(client, {
        kind: "category.deleted",
        id: "category-1",
      });
    });
    mutation.expectPending();
    await mutation.resolve();
  });
});
