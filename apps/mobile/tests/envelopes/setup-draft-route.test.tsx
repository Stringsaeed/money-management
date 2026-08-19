import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type { SQLiteDatabase } from "expo-sqlite";

import SetupDraftRoute from "@/app/(tabs)/envelopes/setup";
import {
  insertBudgetAccount,
  setupBudgetingDatabase,
} from "@/modules/budgeting/budgeting-test-utils";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";

let mockDatabase: SQLiteDatabase;

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockDatabase,
}));

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    Link: ({ children }: { children: ReactNode }) =>
      React.isValidElement(children) ? React.cloneElement(children) : children,
  };
});

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];
const queryClients: QueryClient[] = [];

afterEach(async () => {
  await cleanup();
  queryClients.splice(0).forEach((client) => client.clear());
  databases.splice(0).forEach(({ close }) => close());
});

describe("Setup Draft route", () => {
  it("explains cash-backed setup and gives direct prerequisite actions", async () => {
    await setup();

    await renderRoute();

    expect(await screen.findByText("Give your Money a job 🌱")).toBeOnTheScreen();
    expect(screen.getByText(/reserve Money you already hold/)).toBeOnTheScreen();
    expect(screen.getByLabelText("Add an Account")).toBeOnTheScreen();
    expect(screen.getByLabelText("Add a Category")).toBeOnTheScreen();
    expect(screen.getByLabelText("Use Category suggestions")).toBeDisabled();
    expect(screen.getByLabelText("Start with a blank plan")).toBeDisabled();
  });

  it("creates suggested Envelopes, reviews Mappings, merges them, and keeps zero Assignments", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    await insertAccount(database, "card", "Credit card", "USD", "credit_card");
    await insertAccount(database, "investment", "Brokerage", "USD", "investment");
    await insertCategory(database, "groceries", "Groceries", "🥕");
    await insertCategory(database, "dining", "Dining", "🍽️");
    await renderRoute();

    await fireEvent.press(await screen.findByLabelText("Use Category suggestions"));

    expect(await screen.findByText("Setup Draft resumed ✍️")).toBeOnTheScreen();
    expect(screen.getByText("Everyday checking")).toBeOnTheScreen();
    expect(screen.getByLabelText("Remove Everyday checking Funding Account")).toBeOnTheScreen();
    expect(screen.queryByText(/Credit card/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/Brokerage/)).not.toBeOnTheScreen();
    expect(screen.getByText("🥕 Groceries")).toBeOnTheScreen();
    expect(screen.getByText("🍽️ Dining")).toBeOnTheScreen();
    expect(screen.getAllByDisplayValue("0.00")).toHaveLength(2);

    await fireEvent.press(screen.getByLabelText("Remove Everyday checking Funding Account"));
    await screen.findByLabelText("Add Everyday checking Funding Account");
    await fireEvent.press(screen.getByLabelText("Add Everyday checking Funding Account"));
    await screen.findByLabelText("Remove Everyday checking Funding Account");

    await fireEvent.press(screen.getByLabelText("Map Groceries to Dining"));
    await waitFor(() =>
      expect(screen.queryByLabelText("Map Groceries to Dining")).not.toBeOnTheScreen(),
    );

    await fireEvent.press(screen.getByLabelText("Merge USD suggestions"));

    await waitFor(() => expect(screen.getAllByDisplayValue("0.00")).toHaveLength(1));
    expect(screen.getByText("🥕 Groceries")).toBeOnTheScreen();
    expect(screen.getByText("🍽️ Dining")).toBeOnTheScreen();
  });

  it("supports a blank plan and renders one workspace for every eligible currency", async () => {
    const database = await setup();
    await insertAccount(database, "usd", "USD checking", "USD", "checking");
    await insertAccount(database, "aed", "AED savings", "AED", "savings");
    await insertCategory(database, "groceries", "Groceries", "🥕");
    await renderRoute();

    await fireEvent.press(await screen.findByLabelText("Start with a blank plan"));

    expect(await screen.findByText("USD workspace")).toBeOnTheScreen();
    expect(screen.getByText("AED workspace")).toBeOnTheScreen();
    expect(screen.getAllByText("Blank plan — add Envelopes during final review.")).toHaveLength(2);
    expect(screen.queryByDisplayValue("0.00")).not.toBeOnTheScreen();
  });

  it("resumes a real SQLite draft across remount and discards only that draft", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    await insertCategory(database, "groceries", "Groceries", "🥕");
    await createBudgetingCoordinator(database).createSetupDraft({
      mode: "suggested",
      currencies: ["USD"],
      now: "2026-08-19T08:00:00.000Z",
    });
    const before = await activeFactCounts(database);

    const first = await renderRoute();
    expect(await screen.findByText("Setup Draft resumed ✍️")).toBeOnTheScreen();
    await first.unmount();
    await renderRoute();
    expect(await screen.findByText("🥕 Groceries")).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText("Discard Setup Draft"));

    expect(await screen.findByText("Give your Money a job 🌱")).toBeOnTheScreen();
    await expect(createBudgetingCoordinator(database).loadSetupDraft()).resolves.toBeNull();
    expect(await activeFactCounts(database)).toEqual(before);
  });

  it("allows blank setup when Categories are missing but keeps the direct Category action", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    const view = await renderRoute();

    expect(await view.findByLabelText("Add a Category")).toBeOnTheScreen();
    expect(view.getByLabelText("Use Category suggestions")).toBeDisabled();
    expect(view.getByLabelText("Start with a blank plan")).toBeEnabled();

    await fireEvent.press(view.getByLabelText("Start with a blank plan"));

    expect(
      await view.findByText("Blank plan — add Envelopes during final review."),
    ).toBeOnTheScreen();
  });
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  databases.push(testDatabase);
  mockDatabase = testDatabase.database;
  return testDatabase.database;
}

async function renderRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  queryClients.push(queryClient);
  return render(
    <QueryClientProvider client={queryClient}>
      <SetupDraftRoute />
    </QueryClientProvider>,
  );
}

async function insertAccount(
  database: SQLiteDatabase,
  id: string,
  name: string,
  currency: string,
  type: "checking" | "savings" | "credit_card" | "investment",
): Promise<void> {
  await insertBudgetAccount(database, { id, currency, initialBalance: 100_00, type });
  await database.runAsync("UPDATE accounts SET name = ? WHERE id = ?", name, id);
}

async function insertCategory(
  database: SQLiteDatabase,
  id: string,
  name: string,
  icon: string,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'expense', '#B48A7B', ?, NULL, 0, ?, ?)`,
    id,
    name,
    icon,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

async function activeFactCounts(database: SQLiteDatabase) {
  return Promise.all(
    [
      "budget_workspaces",
      "funding_memberships",
      "envelopes",
      "category_mappings",
      "assignments",
      "rollover_settings",
    ].map(async (table) => ({
      table,
      count: (
        await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)
      )?.count,
    })),
  );
}
