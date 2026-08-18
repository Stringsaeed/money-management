import { afterEach } from "@jest/globals";
import { act } from "@testing-library/react-native";

import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { useArchiveCategory } from "@/hooks/use-categories";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockCohereLedgerCache = jest.fn();
const databases: { close: VoidFunction }[] = [];

async function setupCategoryReferencesDatabase() {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-04-15",
    now: "2026-04-15T08:00:00.000Z",
  });
  await migrateBudgeting(testDatabase.database);
  await migrateCategoryLifecycle(testDatabase.database);
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

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockUseDatabase(),
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("useArchiveCategory integration", () => {
  it("preserves persisted Category references before reporting archival", async () => {
    const database = await setupCategoryReferencesDatabase();
    mockUseDatabase.mockReturnValue(database);
    let referencesAtReport!: {
      transactionCategoryId: string | null;
      ruleCategoryId: string | null;
      lifecycle: string | null;
    };
    mockCohereLedgerCache.mockImplementationOnce(async () => {
      const [transaction, rule, category] = await Promise.all([
        database.getFirstAsync<{ categoryId: string | null }>(
          "SELECT category_id AS categoryId FROM transactions WHERE id = ?",
          "transaction-1",
        ),
        database.getFirstAsync<{ categoryId: string | null }>(
          "SELECT category_id AS categoryId FROM recurring_rules WHERE id = ?",
          "rule-1",
        ),
        database.getFirstAsync<{ lifecycle: string }>(
          "SELECT lifecycle FROM categories WHERE id = ?",
          "category-1",
        ),
      ]);
      referencesAtReport = {
        transactionCategoryId: transaction?.categoryId ?? null,
        ruleCategoryId: rule?.categoryId ?? null,
        lifecycle: category?.lifecycle ?? null,
      };
    });

    const { result } = await renderHookWithProviders(() => useArchiveCategory());

    await act(async () => {
      await result.current.mutateAsync("category-1");
    });

    expect(referencesAtReport).toEqual({
      transactionCategoryId: "category-1",
      ruleCategoryId: "category-1",
      lifecycle: "archived",
    });
  });
});
