import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import BudgetWorkspaceScreen from "@/app/(tabs)/envelopes/workspace";
import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { budgetKeys } from "@/modules/ledger-cache";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

let mockDatabase: SQLiteDatabase;

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockDatabase,
}));

const databases: { close: VoidFunction }[] = [];
const queryClients: QueryClient[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
  queryClients.splice(0).forEach((queryClient) => queryClient.clear());
});

describe("app/(tabs)/envelopes/workspace", () => {
  it("exposes the only currency workspace as the accessible selection", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);

    await renderRoute();

    const workspace = await screen.findByRole("radio", { name: "USD currency workspace" });
    expect(workspace.props.accessibilityState).toEqual({ disabled: false, selected: true });
  });

  it("persists selection among multiple workspaces without combining their Money", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    await activate(database, "AED", 500_00);
    await createBudgetingCoordinator(database).setHomeCurrency({ currency: "USD" });

    await renderRoute();

    expect(
      (await screen.findByRole("radio", { name: "USD currency workspace" })).props
        .accessibilityState,
    ).toEqual({ disabled: false, selected: true });
    const aedWorkspace = screen.getByRole("radio", { name: "AED currency workspace" });
    expect(aedWorkspace.props.accessibilityState).toEqual({ disabled: false, selected: false });

    await act(async () => {
      fireEvent.press(aedWorkspace);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("radio", { name: "AED currency workspace" }).props.accessibilityState,
      ).toEqual({ disabled: false, selected: true });
    });
  });
});

async function setup() {
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
  await migrateAccountLifecycle(mockDatabase);
  return testDatabase;
}

async function activate(database: SQLiteDatabase, currency: string, balance: number) {
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

async function renderRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  queryClients.push(queryClient);
  await queryClient.prefetchQuery({
    queryKey: budgetKeys.workspaces,
    queryFn: () => createBudgetingCoordinator(mockDatabase).getWorkspaceSelection(),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BudgetWorkspaceScreen />
    </QueryClientProvider>,
  );
}
