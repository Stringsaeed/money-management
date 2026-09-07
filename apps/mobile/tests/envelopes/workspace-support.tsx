import { jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import type { SQLiteDatabase } from "@/db/sqlite";

import BudgetWorkspaceScreen from "@/app/(tabs)/envelopes/workspace";
import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { budgetKeys } from "@/modules/ledger-cache";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

let mockDatabase: SQLiteDatabase;

jest.mock("@/db/sqlite", () => ({
  useSQLiteContext: () => mockDatabase,
}));

jest.mock("@/utils/id", () => ({
  generateId: () => "generated-envelope-id",
}));

jest.mock("@/utils/date", () => {
  const actual = jest.requireActual<typeof import("@/utils/date")>("@/utils/date");
  return {
    ...actual,
    today: () => "2026-08-19",
    nowIso: () => "2026-08-19T08:00:00.000Z",
  };
});

const databases: { close: VoidFunction }[] = [];
const queryClients: QueryClient[] = [];

export function cleanupWorkspaceRouteTests(): void {
  databases.splice(0).forEach(({ close }) => close());
  queryClients.splice(0).forEach((queryClient) => queryClient.clear());
}

export function useRouteDatabase(database: SQLiteDatabase): void {
  mockDatabase = database;
}

export async function setupRouteDatabase() {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  mockDatabase = testDatabase.database;
  await applyLegacyMigrations(mockDatabase);
  await migrateRecurringRules(mockDatabase, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await migrateBudgeting(mockDatabase);
  await migrateCategoryLifecycle(mockDatabase);
  await migrateAccountLifecycle(mockDatabase);
  return testDatabase;
}

export async function insertRouteCategory(database: SQLiteDatabase, id: string, name: string) {
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'expense', '#B48A7B', '🏷️', NULL, 0, ?, ?)`,
    id,
    name,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

export async function activateRouteWorkspace(
  database: SQLiteDatabase,
  currency: string,
  balance: number,
) {
  const accountId = `account-${currency.toLowerCase()}`;
  await database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'checking', ?, '#8B9D83', '🏦', ?, 0, 0, ?, ?)`,
    accountId,
    accountId,
    currency,
    balance,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
  await createBudgetingCoordinator(database).activateWorkspace({
    currency,
    fundingAccountIds: [accountId],
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
}

export function createRouteEnvelope(
  database: SQLiteDatabase,
  input: { id: string; name: string; categoryIds: string[] },
) {
  return createBudgetingCoordinator(database).createEnvelope({
    ...input,
    currency: "USD",
    icon: "📦",
    color: "#8B9D83",
    positiveRollover: true,
    localDate: "2026-08-19",
    now: "2026-08-19T08:00:00.000Z",
  });
}

export async function renderWorkspaceRoute(
  options: {
    prefetch?: boolean;
    selection?: Awaited<
      ReturnType<ReturnType<typeof createBudgetingCoordinator>["getWorkspaceSelection"]>
    >;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, staleTime: Infinity },
    },
  });
  queryClients.push(queryClient);
  if (options.selection) queryClient.setQueryData(budgetKeys.workspaces, options.selection);
  if (options.prefetch !== false && !options.selection) {
    await queryClient.prefetchQuery({
      queryKey: budgetKeys.workspaces,
      queryFn: () => createBudgetingCoordinator(mockDatabase).getWorkspaceSelection(),
    });
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <BudgetWorkspaceScreen />
    </QueryClientProvider>,
  );
}
