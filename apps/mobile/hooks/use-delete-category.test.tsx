import { afterEach } from "@jest/globals";
import { act } from "@testing-library/react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { useDeleteCategory } from "@/hooks/use-categories";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockCohereLedgerCache = jest.fn();
const databases: { close: VoidFunction }[] = [];

// The lifecycle hooks read the raw SQLite context (they need transactions and
// raw SQL for cascade checks), so provide it directly to expo-sqlite's hook.
let mockRawDatabase: SQLiteDatabase | null = null;

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockRawDatabase,
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

async function setupCategoriesDatabase() {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-04-15",
    now: "2026-04-15T08:00:00.000Z",
  });
  await migrateCategoryLifecycle(testDatabase.database);
  await migrateBudgeting(testDatabase.database);
  mockRawDatabase = testDatabase.database;
  return testDatabase.database;
}

describe("useDeleteCategory", () => {
  it("deletes a history-free Category through the lifecycle path", async () => {
    const database = await setupCategoriesDatabase();
    await database.runAsync(
      `INSERT INTO categories (
        id, name, type, color, icon, parent_id, sort_order,
        lifecycle, created_at, updated_at
      ) VALUES ('category-1', 'Dining', 'expense', '#B48A7B', '🍽️', NULL, 0,
        'active', ?, ?)`,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );

    let existsAtReport!: boolean;
    mockCohereLedgerCache.mockImplementationOnce(async () => {
      const row = await database.getFirstAsync<{ id: string }>(
        "SELECT id FROM categories WHERE id = ?",
        "category-1",
      );
      existsAtReport = row !== null;
    });

    const { result } = await renderHookWithProviders(() => useDeleteCategory());

    await act(async () => {
      await result.current.mutateAsync("category-1");
    });

    expect(existsAtReport).toBe(false);
    expect(mockCohereLedgerCache).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: "category.deleted", id: "category-1" }),
    );
  });

  it("rejects deleting a Category that still has ledger history", async () => {
    const database = await setupCategoriesDatabase();
    await database.runAsync(
      `INSERT INTO categories (
        id, name, type, color, icon, parent_id, sort_order,
        lifecycle, created_at, updated_at
      ) VALUES ('category-1', 'Dining', 'expense', '#B48A7B', '🍽️', NULL, 0,
        'active', ?, ?)`,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES ('account-1', 'Main', 'checking', 'USD', '#8B9D83', '🏦', 0, 0, 0, ?, ?)`,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id,
        is_recurring, description, created_at, updated_at
      ) VALUES ('transaction-1', 'expense', 1200, 'USD', '2026-04-01', 'account-1',
        'category-1', 0, '', ?, ?)`,
      "2026-04-01T08:00:00.000Z",
      "2026-04-01T08:00:00.000Z",
    );

    const { result } = await renderHookWithProviders(() => useDeleteCategory());

    await act(async () => {
      await expect(result.current.mutateAsync("category-1")).rejects.toThrow();
    });
    // ADR-0009: history-bearing categories are archived, never deleted.
    const row = await database.getFirstAsync(
      "SELECT id FROM categories WHERE id = ?",
      "category-1",
    );
    expect(row).not.toBeNull();
  });
});
