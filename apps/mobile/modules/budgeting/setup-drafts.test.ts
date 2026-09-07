import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "@/db/sqlite";

import {
  countActiveBudgetFacts,
  insertBudgetAccount,
  insertBudgetTransaction,
  setupBudgetingDatabase,
} from "./budgeting-test-utils";
import {
  addSetupDraftEnvelope,
  mergeSetupDraftEnvelopes,
  updateSetupDraftEnvelope,
} from "./setup-draft-editing";
import { discardSetupDraft, loadSetupDraft, saveSetupDraft } from "./setup-draft-persistence";
import { createSetupDraft } from "./setup-drafts";
import { getSetupDraftPrerequisites } from "./setup-draft-suggestions";
import { validateSetupDraft } from "./setup-draft-validation";

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
    const factsBefore = await countActiveBudgetFacts(database);
    const created = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-19",
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
    const saved = await saveSetupDraft(database, {
      draft: merged,
      localDate: "2026-08-19",
      now: "2026-08-19T09:00:00.000Z",
    });

    await expect(loadSetupDraft(database)).resolves.toEqual(saved);
    expect(saved.workspaces[0]?.envelopes).toEqual([
      expect.objectContaining({ categoryIds: ["dining", "groceries"] }),
    ]);
    expect(await countActiveBudgetFacts(database)).toEqual(factsBefore);

    await discardSetupDraft(database);

    await expect(loadSetupDraft(database)).resolves.toBeNull();
    expect(await countActiveBudgetFacts(database)).toEqual(factsBefore);
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
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    expect(draft.workspaces).toEqual([
      { currency: "USD", fundingAccountIds: ["usd"], envelopes: [] },
      { currency: "AED", fundingAccountIds: ["aed"], envelopes: [] },
    ]);
    expect(JSON.stringify(draft)).not.toContain("assignment");
    await expect(loadSetupDraft(database)).resolves.toEqual(draft);
  });

  it("adds and persists a customizable Envelope in a secondary currency blank workspace", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, { id: "aed", currency: "AED", initialBalance: 300_00 });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const blank = await createSetupDraft(database, {
      mode: "blank",
      currencies: ["USD", "AED"],
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    const added = addSetupDraftEnvelope(blank, "AED", {
      id: "aed-rent",
      name: "Rent",
      icon: "🏠",
      color: "#B48A7B",
    });
    const edited = updateSetupDraftEnvelope(added, "AED", "aed-rent", {
      categoryIds: ["groceries"],
      positiveRollover: false,
      initialAssignmentMinor: 25_00,
    });

    await saveSetupDraft(database, {
      draft: edited,
      localDate: "2026-08-19",
      now: "2026-08-19T09:00:00.000Z",
    });
    await expect(loadSetupDraft(database)).resolves.toMatchObject({
      workspaces: [
        expect.anything(),
        {
          currency: "AED",
          envelopes: [
            expect.objectContaining({
              id: "aed-rent",
              name: "Rent",
              categoryIds: ["groceries"],
              positiveRollover: false,
              initialAssignmentMinor: 25_00,
            }),
          ],
        },
      ],
    });
  });

  it("keeps a Category draftable when old activity used another currency", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, { id: "aed", currency: "AED", initialBalance: 100_00 });
    await insertCategory(database, { id: "travel", name: "Travel" });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id,
        is_recurring, description, created_at, updated_at
      ) VALUES ('old-aed', 'expense', 100, 'AED', '2025-01-01', 'aed', 'travel', 0, '', ?, ?)`,
      "2025-01-01T08:00:00.000Z",
      "2025-01-01T08:00:00.000Z",
    );

    await expect(
      createSetupDraft(database, {
        mode: "suggested",
        currencies: ["USD"],
        localDate: "2026-08-19",
        now: "2026-08-19T08:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      workspaces: [{ envelopes: [expect.objectContaining({ categoryIds: ["travel"] })] }],
    });
  });

  it("merges a user-selected non-adjacent set of three suggestions into the first selection", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    for (const [id, name] of [
      ["a", "Alpha"],
      ["b", "Bravo"],
      ["c", "Charlie"],
      ["d", "Delta"],
    ] as const) {
      await insertCategory(database, { id, name });
    }
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });
    const envelopes = draft.workspaces[0]!.envelopes;

    const merged = mergeSetupDraftEnvelopes(draft, "USD", [
      envelopes[3]!.id,
      envelopes[0]!.id,
      envelopes[2]!.id,
    ]);

    expect(merged.workspaces[0]!.envelopes).toHaveLength(2);
    expect(merged.workspaces[0]!.envelopes.find(({ id }) => id === envelopes[3]!.id)).toMatchObject(
      {
        name: "Delta",
        categoryIds: ["d", "a", "c"],
      },
    );
  });

  it("accepts active other Accounts as optional Funding choices without selecting them", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    await insertBudgetAccount(database, { id: "other", initialBalance: 20_00, type: "other" });
    await insertCategory(database, { id: "groceries", name: "Groceries" });

    const prerequisites = await getSetupDraftPrerequisites(database);
    const draft = await createSetupDraft(database, {
      mode: "blank",
      currencies: ["USD"],
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    expect(prerequisites.fundingAccounts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "other", suggested: false })]),
    );
    expect(draft.workspaces[0]!.fundingAccountIds).toEqual(["checking"]);
  });

  it("rejects valid JSON with the wrong saved payload shape and explains recovery", async () => {
    const database = await setup();
    await database.runAsync(
      "INSERT INTO setup_drafts (id, payload, created_at, updated_at) VALUES (?, ?, ?, ?)",
      "guided-envelope-setup",
      JSON.stringify({ version: 1, workspaces: "wrong" }),
      "2026-08-19T08:00:00.000Z",
      "2026-08-19T08:00:00.000Z",
    );

    await expect(loadSetupDraft(database)).rejects.toThrow(
      "saved Setup Draft is unreadable. Discard it and start again",
    );
  });

  it("rejects cross-currency Envelopes and Funding Accounts", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "usd", initialBalance: 100_00 });
    await insertBudgetAccount(database, { id: "aed", currency: "AED", initialBalance: 100_00 });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-19",
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
    await expect(
      saveSetupDraft(database, {
        draft: wrongEnvelope,
        localDate: "2026-08-19",
        now: draft.updatedAt,
      }),
    ).rejects.toThrow("not workspace currency USD");
    const wrongAccount = {
      ...draft,
      workspaces: [{ ...draft.workspaces[0]!, fundingAccountIds: ["aed"] }],
    };
    await expect(
      saveSetupDraft(database, {
        draft: wrongAccount,
        localDate: "2026-08-19",
        now: draft.updatedAt,
      }),
    ).rejects.toThrow("Account aed in AED");
  });

  it("rejects duplicate Category Mappings and invalid initial Assignment plans", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 50_00 });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-19",
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
    await expect(
      saveSetupDraft(database, {
        draft: duplicate,
        localDate: "2026-08-19",
        now: draft.updatedAt,
      }),
    ).rejects.toThrow("may appear in only one Envelope");

    const negative = updateSetupDraftEnvelope(draft, "USD", envelope.id, {
      initialAssignmentMinor: -1,
    });
    await expect(
      saveSetupDraft(database, {
        draft: negative,
        localDate: "2026-08-19",
        now: draft.updatedAt,
      }),
    ).rejects.toThrow("cannot be negative");
    const unfunded = updateSetupDraftEnvelope(draft, "USD", envelope.id, {
      initialAssignmentMinor: 50_01,
    });
    await expect(
      saveSetupDraft(database, {
        draft: unfunded,
        localDate: "2026-08-19",
        now: draft.updatedAt,
      }),
    ).rejects.toThrow("cannot exceed");

    const duplicateFunding = {
      ...draft,
      workspaces: [{ ...draft.workspaces[0]!, fundingAccountIds: ["checking", "checking"] }],
    };
    await expect(
      saveSetupDraft(database, {
        draft: duplicateFunding,
        localDate: "2026-08-19",
        now: draft.updatedAt,
      }),
    ).rejects.toThrow("Funding Accounts must be distinct");
  });

  it("does not let next-period income authorize a current-period Assignment", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    await insertBudgetTransaction(database, {
      id: "september-income",
      type: "income",
      amount: 100_00,
      date: "2026-09-01",
      accountId: "checking",
    });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-31",
      now: "2026-09-01T02:00:00.000Z",
    });
    const assigned = updateSetupDraftEnvelope(draft, "USD", draft.workspaces[0]!.envelopes[0]!.id, {
      initialAssignmentMinor: 150_00,
    });

    await expect(
      saveSetupDraft(database, {
        draft: assigned,
        localDate: "2026-08-31",
        now: "2026-09-01T02:01:00.000Z",
      }),
    ).rejects.toThrow("cannot exceed");
  });

  it("does not let next-period expense reject a valid current-period Assignment", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    await insertBudgetTransaction(database, {
      id: "september-expense",
      type: "expense",
      amount: 80_00,
      date: "2026-09-01",
      accountId: "checking",
    });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-31",
      now: "2026-09-01T02:00:00.000Z",
    });
    const assigned = updateSetupDraftEnvelope(draft, "USD", draft.workspaces[0]!.envelopes[0]!.id, {
      initialAssignmentMinor: 80_00,
    });

    await expect(
      saveSetupDraft(database, {
        draft: assigned,
        localDate: "2026-08-31",
        now: "2026-09-01T02:01:00.000Z",
      }),
    ).resolves.toMatchObject({ workspaces: [{ envelopes: [{ initialAssignmentMinor: 80_00 }] }] });
  });

  it("uses current-period ledger activity for Setup Assignment capacity", async () => {
    const database = await setup();
    await insertBudgetAccount(database, { id: "checking", initialBalance: 100_00 });
    await insertBudgetTransaction(database, {
      id: "august-income",
      type: "income",
      amount: 25_00,
      date: "2026-08-01",
      accountId: "checking",
    });
    await insertBudgetTransaction(database, {
      id: "august-expense",
      type: "expense",
      amount: 10_00,
      date: "2026-08-02",
      accountId: "checking",
    });
    await insertCategory(database, { id: "groceries", name: "Groceries" });
    const draft = await createSetupDraft(database, {
      mode: "suggested",
      currencies: ["USD"],
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });
    const envelopeId = draft.workspaces[0]!.envelopes[0]!.id;
    const fullyAssigned = updateSetupDraftEnvelope(draft, "USD", envelopeId, {
      initialAssignmentMinor: 115_00,
    });
    const overAssigned = updateSetupDraftEnvelope(draft, "USD", envelopeId, {
      initialAssignmentMinor: 115_01,
    });

    await expect(
      validateSetupDraft(database, fullyAssigned, { localDate: "2026-08-19" }),
    ).resolves.toBeUndefined();
    await expect(
      validateSetupDraft(database, overAssigned, { localDate: "2026-08-19" }),
    ).rejects.toThrow("cannot exceed");
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
