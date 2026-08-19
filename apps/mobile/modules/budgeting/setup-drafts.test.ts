import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { insertBudgetAccount, setupBudgetingDatabase } from "./budgeting-test-utils";
import {
  createSetupDraft,
  discardSetupDraft,
  loadSetupDraft,
  mergeSetupDraftEnvelopes,
  saveSetupDraft,
  updateSetupDraftEnvelope,
} from "./setup-drafts";
import { getSetupDraftPrerequisites } from "./setup-draft-suggestions";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => databases.splice(0).forEach(({ close }) => close()));

describe("Setup Drafts", () => {
  it("suggests only active cash-backed Funding Accounts and active expense Categories", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    await insertBudgetAccount(database, {
      id: "savings",
      initialBalance: 200_00,
      type: "savings",
    });
    await insertBudgetAccount(database, { id: "cash", initialBalance: 20_00, type: "cash" });
    await insertBudgetAccount(database, { id: "card", initialBalance: 0, type: "credit_card" });
    await insertBudgetAccount(database, {
      id: "investment",
      initialBalance: 500_00,
      type: "investment",
    });
    await insertBudgetAccount(database, {
      id: "archived",
      initialBalance: 0,
      lifecycle: "archived",
    });
    await insertCategory(database, { id: "groceries", name: "Groceries", icon: "🥕" });
    await insertCategory(database, { id: "salary", name: "Salary", type: "income" });
    await insertCategory(database, { id: "old", name: "Old", lifecycle: "archived" });

    const prerequisites = await getSetupDraftPrerequisites(database);

    expect(prerequisites.fundingAccounts.map(({ id }) => id)).toEqual([
      "cash",
      "checking",
      "savings",
    ]);
    expect(prerequisites.categories).toEqual([
      { id: "groceries", name: "Groceries", icon: "🥕", color: "#B48A7B" },
    ]);
  });

  it("persists, resumes, merges, and discards a suggested draft without active budget effects", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    await insertCategory(database, { id: "groceries", name: "Groceries", icon: "🥕" });
    await insertCategory(database, { id: "dining", name: "Dining", icon: "🍽️" });
    const factsBefore = await activeFactCounts(database);
    const created = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      now: "2026-08-19T08:00:00.000Z",
    });

    expect(created.workspaces[0]?.envelopes).toEqual([
      expect.objectContaining({
        name: "Dining",
        icon: "🍽️",
        color: "#B48A7B",
        categoryIds: ["dining"],
        initialAssignmentMinor: 0,
      }),
      expect.objectContaining({ name: "Groceries", icon: "🥕", categoryIds: ["groceries"] }),
    ]);
    const merged = mergeSetupDraftEnvelopes(
      created,
      "USD",
      created.workspaces[0]!.envelopes.map(({ id }) => id),
    );
    const saved = await saveSetupDraft(database, merged, "2026-08-19T09:00:00.000Z");

    await expect(loadSetupDraft(database)).resolves.toEqual(saved);
    expect(saved.workspaces[0]?.envelopes).toEqual([
      expect.objectContaining({ categoryIds: ["dining", "groceries"] }),
    ]);
    expect(await activeFactCounts(database)).toEqual(factsBefore);

    await discardSetupDraft(database);

    await expect(loadSetupDraft(database)).resolves.toBeNull();
    expect(await activeFactCounts(database)).toEqual(factsBefore);
  });

  it("persists a blank multi-currency plan with zero initial Assignments", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, {
      id: "aed",
      currency: "AED",
      initialBalance: 300_00,
      type: "savings",
    });
    await insertCategory(database, { id: "groceries", name: "Groceries" });

    const draft = await createSetupDraft(database, {
      mode: "blank",
      currencies: ["USD", "AED"],
      now: "2026-08-19T08:00:00.000Z",
    });

    expect(draft.workspaces).toEqual([
      { currency: "USD", fundingAccountIds: ["usd"], envelopes: [] },
      { currency: "AED", fundingAccountIds: ["aed"], envelopes: [] },
    ]);
    expect(JSON.stringify(draft)).not.toContain("assignment");
    await expect(loadSetupDraft(database)).resolves.toEqual(draft);
  });

  it("rejects cross-currency Envelopes and Funding Accounts", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, { id: "aed", currency: "AED", initialBalance: 100_00 });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      now: "2026-08-19T08:00:00.000Z",
    });

    const wrongEnvelope = {
      ...draft,
      workspaces: [
        {
          ...draft.workspaces[0]!,
          envelopes: [{ ...draft.workspaces[0]!.envelopes[0]!, currency: "AED" }],
        },
      ],
    };
    await expect(saveSetupDraft(database, wrongEnvelope, draft.updatedAt)).rejects.toThrow(
      "not workspace currency USD",
    );
    const wrongAccount = {
      ...draft,
      workspaces: [{ ...draft.workspaces[0]!, fundingAccountIds: ["aed"] }],
    };
    await expect(saveSetupDraft(database, wrongAccount, draft.updatedAt)).rejects.toThrow(
      "Account aed in AED",
    );
  });

  it("rejects duplicate Category Mappings and invalid initial Assignment plans", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 50_00 });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      now: "2026-08-19T08:00:00.000Z",
    });
    const envelope = draft.workspaces[0]!.envelopes[0]!;
    const duplicate = {
      ...draft,
      workspaces: [
        {
          ...draft.workspaces[0]!,
          envelopes: [envelope, { ...envelope, id: "duplicate", name: "Duplicate" }],
        },
      ],
    };
    await expect(saveSetupDraft(database, duplicate, draft.updatedAt)).rejects.toThrow(
      "may appear in only one Envelope",
    );

    const negative = updateSetupDraftEnvelope(draft, "USD", envelope.id, {
      initialAssignmentMinor: -1,
    });
    await expect(saveSetupDraft(database, negative, draft.updatedAt)).rejects.toThrow(
      "cannot be negative",
    );
    const unfunded = updateSetupDraftEnvelope(draft, "USD", envelope.id, {
      initialAssignmentMinor: 50_01,
    });
    await expect(saveSetupDraft(database, unfunded, draft.updatedAt)).rejects.toThrow(
      "cannot exceed",
    );

    const duplicateFunding = {
      ...draft,
      workspaces: [{ ...draft.workspaces[0]!, fundingAccountIds: ["checking", "checking"] }],
    };
    await expect(saveSetupDraft(database, duplicateFunding, draft.updatedAt)).rejects.toThrow(
      "Funding Accounts must be distinct",
    );
  });
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  databases.push(testDatabase);
  return testDatabase.database;
}

async function insertCategory(
  database: SQLiteDatabase,
  input: {
    id: string;
    name: string;
    icon?: string;
    type?: "income" | "expense";
    lifecycle?: "active" | "archived";
  },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, '#B48A7B', ?, NULL, 0, ?, ?)`,
    input.id,
    input.name,
    input.type ?? "expense",
    input.icon ?? "🏷️",
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
  if (input.lifecycle === "archived") {
    await database.runAsync(
      "UPDATE categories SET lifecycle = 'archived', lifecycle_changed_at = ? WHERE id = ?",
      "2026-08-01T00:00:00.000Z",
      input.id,
    );
  }
}

async function activeFactCounts(database: SQLiteDatabase) {
  const tables = [
    "budget_workspaces",
    "funding_memberships",
    "envelopes",
    "category_mappings",
    "assignments",
    "rollover_settings",
  ];
  return Promise.all(
    tables.map(async (table) => ({
      table,
      count: (
        await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)
      )?.count,
    })),
  );
}
