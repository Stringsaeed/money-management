import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type { TestInstance } from "test-renderer";
import type { SQLiteDatabase } from "expo-sqlite";

import SetupDraftRoute from "@/app/(tabs)/envelopes/setup";
import {
  countActiveBudgetFacts,
  insertBudgetAccount,
  setupBudgetingDatabase,
} from "@/modules/budgeting/budgeting-test-utils";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";

let mockDatabase: SQLiteDatabase;

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockDatabase,
}));

jest.mock("@/utils/id", () => ({
  generateId: () => "generated-setup-envelope",
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
  await waitFor(() => expect(queryClients.every((client) => client.isMutating() === 0)).toBe(true));
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

    await fireEvent.press(screen.getByLabelText("Select Dining for merge"));
    await fireEvent.press(screen.getByLabelText("Select Groceries for merge"));
    await fireEvent.press(screen.getByLabelText("Merge 2 selected USD Envelopes"));

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
    expect(
      screen.getAllByText("Blank plan — add an Envelope whenever you are ready."),
    ).toHaveLength(2);
    expect(screen.queryByDisplayValue("0.00")).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText("Add AED Envelope"));
    const nameInput = await screen.findByLabelText("AED Envelope name");
    await fireEvent.changeText(nameInput, "Holiday");
    await fireEvent(nameInput, "endEditing", {
      nativeEvent: { text: "Holiday" },
    });
    await screen.findByLabelText("Holiday Envelope emoji");
    await fireEvent.changeText(screen.getByLabelText("Holiday Envelope emoji"), "✈️");
    await fireEvent(screen.getByLabelText("Holiday Envelope emoji"), "endEditing", {
      nativeEvent: { text: "✈️" },
    });
    await fireEvent.press(screen.getByLabelText("Map Groceries to Holiday"));
    await fireEvent.press(screen.getByLabelText("Toggle Holiday Rollover"));
    await fireEvent.changeText(screen.getByLabelText("Holiday initial Assignment"), "25.00");
    await fireEvent(screen.getByLabelText("Holiday initial Assignment"), "endEditing", {
      nativeEvent: { text: "25.00" },
    });

    await waitFor(async () => {
      await expect(createBudgetingCoordinator(database).loadSetupDraft()).resolves.toMatchObject({
        workspaces: expect.arrayContaining([
          expect.objectContaining({
            currency: "AED",
            envelopes: [
              expect.objectContaining({
                name: "Holiday",
                icon: "✈️",
                categoryIds: ["groceries"],
                positiveRollover: false,
                initialAssignmentMinor: 25_00,
              }),
            ],
          }),
        ]),
      });
    });
  });

  it("merges a non-adjacent selection of three Envelopes into the first selected target", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    await insertCategory(database, "alpha", "Alpha", "🅰️");
    await insertCategory(database, "bravo", "Bravo", "🅱️");
    await insertCategory(database, "charlie", "Charlie", "🇨");
    await insertCategory(database, "delta", "Delta", "🇩");
    await renderRoute();
    await fireEvent.press(await screen.findByLabelText("Use Category suggestions"));

    await fireEvent.press(await screen.findByLabelText("Select Alpha for merge"));
    await fireEvent.press(screen.getByLabelText("Select Charlie for merge"));
    await fireEvent.press(screen.getByLabelText("Select Delta for merge"));
    expect(screen.getByText("Merge 3 into Alpha (first selected)")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Merge 3 selected USD Envelopes"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alpha")).toBeOnTheScreen();
      expect(screen.queryByDisplayValue("Charlie")).not.toBeOnTheScreen();
      expect(screen.queryByDisplayValue("Delta")).not.toBeOnTheScreen();
    });
    expect(screen.getByText("🅰️ Alpha")).toBeOnTheScreen();
    expect(screen.getByText("🇨 Charlie")).toBeOnTheScreen();
    expect(screen.getByText("🇩 Delta")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Bravo")).toBeOnTheScreen();
  });

  it("serializes rapid Funding, Mapping, and Rollover edits against the latest draft", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    await insertCategory(database, "groceries", "Groceries", "🥕");
    await renderRoute();
    await fireEvent.press(await screen.findByLabelText("Use Category suggestions"));
    await screen.findByText("Setup Draft resumed ✍️");

    const fundingControl = screen.getByLabelText("Remove Everyday checking Funding Account");
    const mappingControl = screen.getByLabelText("Remove Groceries Mapping");
    const rolloverControl = screen.getByLabelText("Toggle Groceries Rollover");
    await act(async () => {
      pressImmediately(fundingControl);
      pressImmediately(mappingControl);
      pressImmediately(rolloverControl);
    });

    await waitFor(async () => {
      await expect(createBudgetingCoordinator(database).loadSetupDraft()).resolves.toMatchObject({
        workspaces: [
          {
            fundingAccountIds: [],
            envelopes: [expect.objectContaining({ categoryIds: [], positiveRollover: false })],
          },
        ],
      });
    });
  });

  it("keeps invalid Assignment text visible and reports an actionable error", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    await insertCategory(database, "groceries", "Groceries", "🥕");
    await renderRoute();
    await fireEvent.press(await screen.findByLabelText("Use Category suggestions"));
    const input = await screen.findByLabelText("Groceries initial Assignment");

    await fireEvent.changeText(input, "-1.001");
    await fireEvent(input, "endEditing", { nativeEvent: { text: "-1.001" } });

    expect(screen.getByDisplayValue("-1.001")).toBeOnTheScreen();
    expect(
      await screen.findByText(/Enter a positive amount with no more than two decimal places/),
    ).toBeOnTheScreen();
    await expect(createBudgetingCoordinator(database).loadSetupDraft()).resolves.toMatchObject({
      workspaces: [{ envelopes: [expect.objectContaining({ initialAssignmentMinor: 0 })] }],
    });
  });

  it("shows active other Accounts as eligible but not selected", async () => {
    const database = await setup();
    await insertAccount(database, "checking", "Everyday checking", "USD", "checking");
    await insertAccount(database, "other", "Gift card", "USD", "other");
    await insertCategory(database, "groceries", "Groceries", "🥕");
    await renderRoute();
    await fireEvent.press(await screen.findByLabelText("Use Category suggestions"));

    expect(await screen.findByLabelText("Add Gift card Funding Account")).toBeOnTheScreen();
    expect(screen.getByLabelText("Remove Everyday checking Funding Account")).toBeOnTheScreen();
  });

  it("offers discard recovery when a saved draft payload is unreadable", async () => {
    const database = await setup();
    await database.runAsync(
      "INSERT INTO setup_drafts (id, payload, created_at, updated_at) VALUES (?, ?, ?, ?)",
      "guided-envelope-setup",
      JSON.stringify({ version: 1, workspaces: "wrong" }),
      "2026-08-19T08:00:00.000Z",
      "2026-08-19T08:00:00.000Z",
    );
    await renderRoute();

    expect(await screen.findByText("Setup Draft is unreadable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Discard unreadable Setup Draft"));
    expect(await screen.findByText("Give your Money a job 🌱")).toBeOnTheScreen();
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
    const before = await countActiveBudgetFacts(database);

    const first = await renderRoute();
    expect(await screen.findByText("Setup Draft resumed ✍️")).toBeOnTheScreen();
    await first.unmount();
    await renderRoute();
    expect(await screen.findByText("🥕 Groceries")).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText("Discard Setup Draft"));

    expect(await screen.findByText("Give your Money a job 🌱")).toBeOnTheScreen();
    await expect(createBudgetingCoordinator(database).loadSetupDraft()).resolves.toBeNull();
    expect(await countActiveBudgetFacts(database)).toEqual(before);
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
      await view.findByText("Blank plan — add an Envelope whenever you are ready."),
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

function pressImmediately(element: TestInstance): void {
  let candidate: TestInstance | null = element;
  while (candidate) {
    if (typeof candidate.props.onPress === "function") {
      candidate.props.onPress();
      return;
    }
    if (typeof candidate.props.onClick === "function") {
      candidate.props.onClick({});
      return;
    }
    candidate = candidate.parent;
  }
  throw new Error("Expected the accessible control to expose a press handler.");
}

async function insertAccount(
  database: SQLiteDatabase,
  id: string,
  name: string,
  currency: string,
  type: "checking" | "savings" | "credit_card" | "investment" | "other",
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
