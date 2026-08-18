import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import BudgetWorkspaceScreen from "@/app/(tabs)/envelopes/workspace";
import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { archiveCategory } from "@/modules/categories/category-lifecycle";
import { budgetKeys } from "@/modules/ledger-cache";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

let mockDatabase: SQLiteDatabase;

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockDatabase,
}));

jest.mock("@/utils/id", () => ({
  generateId: () => "generated-envelope-id",
}));

const databases: { close: VoidFunction }[] = [];
const queryClients: QueryClient[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
  queryClients.splice(0).forEach((queryClient) => queryClient.clear());
});

describe("app/(tabs)/envelopes/workspace", () => {
  it("shows accessible loading and empty workspace states", async () => {
    mockDatabase = {
      getAllAsync: () => new Promise(() => undefined),
    } as unknown as SQLiteDatabase;

    const loadingRoute = await renderRoute({ prefetch: false });

    expect(screen.getByLabelText("Loading currency workspaces")).toBeOnTheScreen();
    loadingRoute.unmount();

    await setup();
    await renderRoute();
    expect(await screen.findByText("No currency workspace yet")).toBeOnTheScreen();
  });

  it("shows actionable workspace and projection errors instead of zero values", async () => {
    mockDatabase = {
      getAllAsync: async () => {
        throw new Error("forced workspace failure");
      },
    } as unknown as SQLiteDatabase;
    const workspaceErrorRoute = await renderRoute({ prefetch: false });
    expect(await screen.findByText("Currency workspaces are unavailable")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Retry currency workspaces" })).toBeOnTheScreen();
    workspaceErrorRoute.unmount();

    const { database } = await setup();
    await activate(database, "USD", 100_00);
    const selection = await createBudgetingCoordinator(database).getWorkspaceSelection();
    mockDatabase = {
      getFirstAsync: async () => {
        throw new Error("forced projection failure");
      },
    } as unknown as SQLiteDatabase;
    await renderRoute({ selection });
    expect(await screen.findByText("Monthly budget is unavailable")).toBeOnTheScreen();
    expect(screen.queryByText("$0.00")).not.toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Retry monthly budget" })).toBeOnTheScreen();
  });

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

  it("creates an Envelope from the page-owned sheet and refreshes the monthly overview", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    await insertCategory(database, "category-groceries", "Groceries");

    await renderRoute();

    expect(await screen.findByText("Unassigned Money")).toBeOnTheScreen();
    expect(screen.getByText("No active Envelopes yet")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "New Envelope" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create Envelope" }));
    expect(await screen.findByText("Envelope name is required")).toBeOnTheScreen();
    expect(screen.getByText("Choose at least one active expense Category")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Food");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Groceries Category" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create Envelope" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Food Envelope" })).toBeOnTheScreen();
    });
    expect(screen.getByText("Available Money")).toBeOnTheScreen();
    expect(screen.getByText(/Assigned Money/)).toBeOnTheScreen();
    expect(screen.getByText(/Net Spent/)).toBeOnTheScreen();
  });

  it("dismisses the page-owned form without writing an Envelope", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    await insertCategory(database, "category-groceries", "Groceries");
    await renderRoute();

    await fireEvent.press(await screen.findByRole("button", { name: "New Envelope" }));
    expect(screen.getByPlaceholderText("e.g. Groceries")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByPlaceholderText("e.g. Groceries")).not.toBeOnTheScreen();
    expect(screen.getByText("No active Envelopes yet")).toBeOnTheScreen();
  });

  it("edits an Envelope without exposing mutable currency or moving Money", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    await insertCategory(database, "category-groceries", "Groceries");
    await createBudgetingCoordinator(database).createEnvelope({
      id: "envelope-food",
      currency: "USD",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-groceries"],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    await renderRoute();
    await fireEvent.press(await screen.findByRole("button", { name: "Edit Food Envelope" }));

    expect(screen.getByText("Edit Envelope")).toBeOnTheScreen();
    expect(screen.getByText("Currency can't be changed after creation.")).toBeOnTheScreen();
    const rollover = screen.getByRole("switch", {
      name: "Carry positive Available Money forward",
    });
    expect(rollover.props.accessibilityState).toEqual({ checked: true });
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Meals");
    await fireEvent.press(rollover);
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Meals Envelope" })).toBeOnTheScreen();
    });
    expect(screen.queryByRole("button", { name: "Edit Food Envelope" })).not.toBeOnTheScreen();
    expect(screen.getByText("$100.00")).toBeOnTheScreen();
  });

  it("requires explicit restored-Category confirmation in the edit sheet", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    await insertCategory(database, "category-groceries", "Groceries");
    await insertCategory(database, "category-dining", "Dining");
    await database.runAsync(
      "UPDATE categories SET lifecycle_changed_at = ? WHERE id = ?",
      "2026-08-18T08:00:00.000Z",
      "category-dining",
    );
    await createBudgetingCoordinator(database).createEnvelope({
      id: "envelope-food",
      currency: "USD",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-groceries"],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    await renderRoute();
    await fireEvent.press(await screen.findByRole("button", { name: "Edit Food Envelope" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Dining Category" }));
    const confirmation = screen.getByRole("checkbox", {
      name: "Confirm future Mapping for Dining",
    });
    expect(confirmation.props.accessibilityState).toEqual({ checked: false });
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    expect(
      await screen.findByText(
        "Confirm restored Category category-dining before creating its future Mapping.",
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(confirmation);
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => {
      expect(screen.queryByText("Edit Envelope")).not.toBeOnTheScreen();
    });
    await expect(
      createBudgetingCoordinator(database).getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({
      envelopes: [{ id: "envelope-food", categoryIds: ["category-dining", "category-groceries"] }],
    });
    await fireEvent.press(screen.getByRole("button", { name: "Edit Food Envelope" }));
    expect(
      screen.getByRole("checkbox", { name: "Dining Category" }).props.accessibilityState,
    ).toMatchObject({ checked: true, disabled: false });
    expect(screen.getByText("Scheduled from 2026-09")).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Food planning");
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => {
      expect(screen.queryByText("Edit Envelope")).not.toBeOnTheScreen();
    });
    await expect(
      createBudgetingCoordinator(database).getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({
      envelopes: [
        {
          id: "envelope-food",
          name: "Food planning",
          categoryIds: ["category-dining", "category-groceries"],
        },
      ],
    });
  });

  it("sorts Needs-Attention rows first and exposes archived Envelopes separately", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    for (const [id, name] of [
      ["category-ready", "Ready"],
      ["category-attention", "Attention"],
      ["category-archived", "Archived"],
    ]) {
      await insertCategory(database, id, name);
    }
    const budgeting = createBudgetingCoordinator(database);
    for (const [id, name, categoryId] of [
      ["envelope-ready", "Ready plan", "category-ready"],
      ["envelope-attention", "Attention plan", "category-attention"],
      ["envelope-archived", "Archived plan", "category-archived"],
    ]) {
      await budgeting.createEnvelope({
        id,
        currency: "USD",
        name,
        icon: "📦",
        color: "#8B9D83",
        categoryIds: [categoryId],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:00:00.000Z",
      });
    }
    await archiveCategory(database, {
      categoryId: "category-attention",
      localDate: "2026-08-19",
      now: "2026-08-19T08:01:00.000Z",
    });
    await database.runAsync(
      "UPDATE envelopes SET lifecycle = 'archived' WHERE id = 'envelope-archived'",
    );

    await renderRoute();

    await screen.findByRole("button", { name: "Edit Attention plan Envelope" });
    const activeRows = screen
      .getAllByRole("button")
      .map(({ props }) => props.accessibilityLabel as string | undefined)
      .filter((label) => label?.startsWith("Edit "));
    expect(activeRows).toEqual(["Edit Attention plan Envelope", "Edit Ready plan Envelope"]);
    expect(screen.getByText(/Needs Attention/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "View archived Envelopes" }));
    expect(screen.getByText("Archived plan")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Edit Archived plan Envelope" }),
    ).not.toBeOnTheScreen();
  });

  it("lets the user change manual order from the edit sheet", async () => {
    const { database } = await setup();
    await activate(database, "USD", 100_00);
    await insertCategory(database, "category-food", "Food");
    await insertCategory(database, "category-bills", "Bills");
    const budgeting = createBudgetingCoordinator(database);
    for (const [id, name, categoryId] of [
      ["envelope-food", "Food", "category-food"],
      ["envelope-bills", "Bills", "category-bills"],
    ]) {
      await budgeting.createEnvelope({
        id,
        currency: "USD",
        name,
        icon: "📦",
        color: "#8B9D83",
        categoryIds: [categoryId],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:00:00.000Z",
      });
    }

    await renderRoute();
    await fireEvent.press(await screen.findByRole("button", { name: "Edit Bills Envelope" }));
    const earlier = screen.getByRole("button", { name: "Move Envelope earlier" });
    expect(earlier.props.accessibilityState).toEqual({ disabled: false });
    await fireEvent.press(earlier);
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => {
      const activeRows = screen
        .getAllByRole("button")
        .map(({ props }) => props.accessibilityLabel as string | undefined)
        .filter((label) => label?.startsWith("Edit "));
      expect(activeRows).toEqual(["Edit Bills Envelope", "Edit Food Envelope"]);
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
  await migrateCategoryLifecycle(mockDatabase);
  await migrateAccountLifecycle(mockDatabase);
  return testDatabase;
}

async function insertCategory(database: SQLiteDatabase, id: string, name: string) {
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

async function renderRoute(
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
