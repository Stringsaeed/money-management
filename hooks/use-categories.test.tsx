import { afterEach } from "@jest/globals";
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
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

const mockUseDatabase = jest.fn();
const mockCohereLedgerCache = jest.fn();
const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

async function setupCategoryReferencesDatabase() {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-04-15",
    now: "2026-04-15T08:00:00.000Z",
  });
  await testDatabase.database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES ('account-1', 'Main', 'checking', 'USD', '#8B9D83', '🏦', 0, 0, 0, ?, ?)`,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
  await testDatabase.database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES ('category-1', 'Dining', 'expense', '#B48A7B', '🍽️', NULL, 0, ?, ?)`,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
  await testDatabase.database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, category_id,
      is_recurring, description, created_at, updated_at
    ) VALUES ('transaction-1', 'expense', 1200, 'USD', '2026-04-01', 'account-1',
      'category-1', 0, '', ?, ?)`,
    "2026-04-01T08:00:00.000Z",
    "2026-04-01T08:00:00.000Z",
  );
  await testDatabase.database.runAsync(
    `INSERT INTO recurring_rules (
      id, name, type, amount_minor, currency, account_id, to_account_id,
      category_id, description, frequency, interval_count, start_date, time_zone,
      lifecycle, health, attention_reasons, eligibility_floor, revision, created_at, updated_at
    ) VALUES ('rule-1', 'Dining budget', 'expense', 1200, 'USD', 'account-1', NULL,
      'category-1', '', 'month', 1, '2026-01-01', 'Asia/Dubai', 'active', 'ready',
      '[]', '2026-01-01', 1, ?, ?)`,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
  return testDatabase.database;
}

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

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

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

  it("clears persisted Category references before reporting deletion", async () => {
    const database = await setupCategoryReferencesDatabase();
    mockUseDatabase.mockReturnValue({
      delete: () => ({
        where: async () => {
          await database.runAsync("DELETE FROM categories WHERE id = ?", "category-1");
        },
      }),
    });
    let referencesAtReport!: {
      transactionCategoryId: string | null;
      ruleCategoryId: string | null;
    };
    mockCohereLedgerCache.mockImplementationOnce(async () => {
      const [transaction, rule] = await Promise.all([
        database.getFirstAsync<{ categoryId: string | null }>(
          "SELECT category_id AS categoryId FROM transactions WHERE id = ?",
          "transaction-1",
        ),
        database.getFirstAsync<{ categoryId: string | null }>(
          "SELECT category_id AS categoryId FROM recurring_rules WHERE id = ?",
          "rule-1",
        ),
      ]);
      referencesAtReport = {
        transactionCategoryId: transaction?.categoryId ?? null,
        ruleCategoryId: rule?.categoryId ?? null,
      };
    });

    const { result } = await renderHookWithProviders(() => useDeleteCategory());

    await act(async () => {
      await result.current.mutateAsync("category-1");
    });

    expect(referencesAtReport).toEqual({ transactionCategoryId: null, ruleCategoryId: null });
  });
});
