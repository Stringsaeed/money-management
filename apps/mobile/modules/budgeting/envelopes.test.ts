import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import {
  insertBudgetAccount,
  setupBudgetingDatabase,
} from "@/modules/budgeting/budgeting-test-utils";
import { archiveCategory, restoreCategory } from "@/modules/categories/category-lifecycle";

import { createBudgetingCoordinator } from "./budgeting";

const databases: { close: VoidFunction }[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("Envelope coordinator", () => {
  it("creates an Envelope with current Category Mappings and Rollover preference atomically", async () => {
    const database = await setupWorkspace();
    await insertCategory(database, { id: "category-groceries", name: "Groceries" });
    await insertCategory(database, { id: "category-dining", name: "Dining" });
    const budgeting = createBudgetingCoordinator(database);

    const projection = await budgeting.createEnvelope({
      id: "envelope-food",
      currency: "USD",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-groceries", "category-dining"],
      positiveRollover: false,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    expect(projection.envelopes).toEqual([
      {
        id: "envelope-food",
        currency: "USD",
        name: "Food",
        icon: "🍲",
        color: "#B48A7B",
        lifecycle: "active",
        sortOrder: 0,
        categoryIds: ["category-dining", "category-groceries"],
        positiveRollover: false,
        health: { status: "ready", reasons: [] },
        availableMoney: { currency: "USD", amountMinor: 0 },
        assignedMoney: { currency: "USD", amountMinor: 0 },
        netSpent: { currency: "USD", amountMinor: 0 },
      },
    ]);
  });

  it("edits current and future mappings while preserving the earlier Budget Period", async () => {
    const database = await setupWorkspace("2026-07-12");
    await insertCategory(database, { id: "category-groceries", name: "Groceries" });
    await insertCategory(database, { id: "category-dining", name: "Dining" });
    await insertCategory(database, { id: "category-utilities", name: "Utilities" });
    const budgeting = createBudgetingCoordinator(database);
    const create = (input: { id: string; name: string; categoryIds: string[] }) =>
      budgeting.createEnvelope({
        ...input,
        currency: "USD",
        icon: "📦",
        color: "#8B9D83",
        positiveRollover: true,
        localDate: "2026-07-12",
        now: "2026-07-12T08:00:00.000Z",
      });
    await create({
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries", "category-dining"],
    });
    await create({
      id: "envelope-bills",
      name: "Bills",
      categoryIds: ["category-utilities"],
    });

    await budgeting.updateEnvelope({
      envelopeId: "envelope-bills",
      name: "Monthly bills",
      icon: "🧾",
      color: "#B48A7B",
      categoryIds: ["category-utilities", "category-groceries"],
      positiveRollover: false,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    const july = await budgeting.getProjection({ currency: "USD", period: "2026-07" });
    const august = await budgeting.getProjection({ currency: "USD", period: "2026-08" });
    expect(july?.envelopes.map(({ id, categoryIds }) => ({ id, categoryIds }))).toEqual([
      {
        id: "envelope-food",
        categoryIds: ["category-dining", "category-groceries"],
      },
      { id: "envelope-bills", categoryIds: ["category-utilities"] },
    ]);
    expect(
      august?.envelopes.map(({ id, name, categoryIds, positiveRollover }) => ({
        id,
        name,
        categoryIds,
        positiveRollover,
      })),
    ).toEqual([
      {
        id: "envelope-food",
        name: "Food",
        categoryIds: ["category-dining"],
        positiveRollover: true,
      },
      {
        id: "envelope-bills",
        name: "Monthly bills",
        categoryIds: ["category-groceries", "category-utilities"],
        positiveRollover: false,
      },
    ]);
  });

  it("preserves a restored Category's current attribution and confirms its future Mapping", async () => {
    const database = await setupWorkspace("2026-07-12");
    await insertCategory(database, { id: "category-groceries", name: "Groceries" });
    await insertCategory(database, { id: "category-dining", name: "Dining" });
    await insertCategory(database, { id: "category-utilities", name: "Utilities" });
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.createEnvelope({
      id: "envelope-food",
      currency: "USD",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-groceries", "category-dining"],
      positiveRollover: true,
      localDate: "2026-07-12",
      now: "2026-07-12T08:00:00.000Z",
    });
    await budgeting.createEnvelope({
      id: "envelope-bills",
      currency: "USD",
      name: "Bills",
      icon: "🧾",
      color: "#8B9D83",
      categoryIds: ["category-utilities"],
      positiveRollover: true,
      localDate: "2026-07-12",
      now: "2026-07-12T08:01:00.000Z",
    });
    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });
    await restoreCategory(database, {
      categoryId: "category-dining",
      now: "2026-08-18T08:01:00.000Z",
    });
    const update = {
      envelopeId: "envelope-bills",
      name: "Bills",
      icon: "🧾",
      color: "#8B9D83",
      categoryIds: ["category-utilities", "category-dining"],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    } as const;

    await expect(budgeting.updateEnvelope(update)).rejects.toThrow(
      "Confirm restored Category category-dining before creating its future Mapping.",
    );
    await budgeting.updateEnvelope({
      ...update,
      confirmedRestoredCategoryIds: ["category-dining"],
    });

    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({
      envelopes: [
        { id: "envelope-food", categoryIds: ["category-dining", "category-groceries"] },
        { id: "envelope-bills", categoryIds: ["category-utilities"] },
      ],
    });
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({
      envelopes: [
        { id: "envelope-food", categoryIds: ["category-groceries"] },
        {
          id: "envelope-bills",
          categoryIds: ["category-dining", "category-utilities"],
        },
      ],
    });
  });

  it("replaces a pre-existing future Mapping when creating an Envelope", async () => {
    const database = await setupWorkspace("2026-07-12");
    for (const [id, name] of [
      ["category-food", "Food"],
      ["category-dining", "Dining"],
      ["category-bills", "Bills"],
      ["category-travel", "Travel"],
    ]) {
      await insertCategory(database, { id, name });
    }
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.createEnvelope({
      id: "envelope-food",
      currency: "USD",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-food", "category-dining"],
      positiveRollover: true,
      localDate: "2026-07-12",
      now: "2026-07-12T08:00:00.000Z",
    });
    await budgeting.createEnvelope({
      id: "envelope-bills",
      currency: "USD",
      name: "Bills",
      icon: "🧾",
      color: "#8B9D83",
      categoryIds: ["category-bills"],
      positiveRollover: true,
      localDate: "2026-07-12",
      now: "2026-07-12T08:01:00.000Z",
    });
    await archiveCategory(database, {
      categoryId: "category-dining",
      localDate: "2026-08-18",
      now: "2026-08-18T08:00:00.000Z",
    });
    await restoreCategory(database, {
      categoryId: "category-dining",
      now: "2026-08-18T08:01:00.000Z",
    });
    await database.runAsync(
      `INSERT INTO category_mappings (
        category_id, envelope_id, effective_from_period, effective_to_period, created_at
      ) VALUES (?, ?, ?, NULL, ?)`,
      "category-dining",
      "envelope-bills",
      "2026-09",
      "2026-08-18T08:02:00.000Z",
    );

    await budgeting.createEnvelope({
      id: "envelope-travel",
      currency: "USD",
      name: "Travel",
      icon: "✈️",
      color: "#8B9D83",
      categoryIds: ["category-travel", "category-dining"],
      confirmedRestoredCategoryIds: ["category-dining"],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    const septemberMappings = await database.getAllAsync<{
      categoryId: string;
      envelopeId: string;
    }>(
      `SELECT category_id AS categoryId, envelope_id AS envelopeId
       FROM category_mappings
       WHERE category_id = ?
         AND effective_from_period <= ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
      "category-dining",
      "2026-09",
      "2026-09",
    );
    expect(septemberMappings).toEqual([
      { categoryId: "category-dining", envelopeId: "envelope-travel" },
    ]);
  });

  it("rolls back the complete Envelope when a mapping or setting cannot persist", async () => {
    const database = await setupWorkspace();
    await insertCategory(database, { id: "category-groceries", name: "Groceries" });
    await database.execAsync(`
      CREATE TRIGGER fail_rollover_setting
      BEFORE INSERT ON rollover_settings
      BEGIN
        SELECT RAISE(ABORT, 'forced rollover failure');
      END;
    `);
    const budgeting = createBudgetingCoordinator(database);

    await expect(
      budgeting.createEnvelope({
        id: "envelope-food",
        currency: "USD",
        name: "Food",
        icon: "🍲",
        color: "#B48A7B",
        categoryIds: ["category-groceries"],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:00:00.000Z",
      }),
    ).rejects.toThrow("forced rollover failure");
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({ envelopes: [] });
  });

  it("refuses an edit that would leave another active Envelope without a Category", async () => {
    const database = await setupWorkspace();
    await insertCategory(database, { id: "category-groceries", name: "Groceries" });
    await insertCategory(database, { id: "category-utilities", name: "Utilities" });
    const budgeting = createBudgetingCoordinator(database);
    for (const [id, name, categoryId] of [
      ["envelope-food", "Food", "category-groceries"],
      ["envelope-bills", "Bills", "category-utilities"],
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

    await expect(
      budgeting.updateEnvelope({
        envelopeId: "envelope-bills",
        name: "Bills",
        icon: "🧾",
        color: "#B48A7B",
        categoryIds: ["category-utilities", "category-groceries"],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:01:00.000Z",
      }),
    ).rejects.toThrow("Envelope envelope-food requires at least one active expense Category.");
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({
      envelopes: [
        { id: "envelope-food", categoryIds: ["category-groceries"] },
        { id: "envelope-bills", categoryIds: ["category-utilities"] },
      ],
    });
  });

  it("rolls back a reassignment that empties an Envelope in another currency", async () => {
    const database = await setupWorkspace();
    await insertBudgetAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 100_00,
    });
    await createBudgetingCoordinator(database).activateWorkspace({
      currency: "AED",
      fundingAccountIds: ["account-aed"],
      localDate: "2026-08-19",
      now: "2026-08-19T07:01:00.000Z",
    });
    await insertCategory(database, { id: "category-usd", name: "USD" });
    await insertCategory(database, { id: "category-aed", name: "AED" });
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.createEnvelope({
      id: "envelope-usd",
      currency: "USD",
      name: "USD Envelope",
      icon: "💵",
      color: "#8B9D83",
      categoryIds: ["category-usd"],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });
    await budgeting.createEnvelope({
      id: "envelope-aed",
      currency: "AED",
      name: "AED Envelope",
      icon: "💴",
      color: "#B48A7B",
      categoryIds: ["category-aed"],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:01:00.000Z",
    });

    await expect(
      budgeting.updateEnvelope({
        envelopeId: "envelope-usd",
        name: "USD Envelope",
        icon: "💵",
        color: "#8B9D83",
        categoryIds: ["category-usd", "category-aed"],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:02:00.000Z",
      }),
    ).rejects.toThrow("Envelope envelope-aed requires at least one active expense Category.");
    await expect(
      budgeting.getProjection({ currency: "AED", period: "2026-08" }),
    ).resolves.toMatchObject({
      envelopes: [{ id: "envelope-aed", categoryIds: ["category-aed"] }],
    });
  });

  it("lists only active expense Categories and explains mapping eligibility", async () => {
    const database = await setupWorkspace();
    await insertCategory(database, { id: "category-groceries", name: "Groceries" });
    await insertCategory(database, { id: "category-dining", name: "Dining" });
    await insertCategory(database, { id: "category-travel", name: "Travel" });
    await insertCategory(database, { id: "category-income", name: "Salary" });
    await database.runAsync("UPDATE categories SET type = 'income' WHERE id = 'category-income'");
    await insertCategory(database, { id: "category-archived", name: "Old" });
    await database.runAsync(
      "UPDATE categories SET lifecycle = 'archived' WHERE id = 'category-archived'",
    );
    await database.runAsync(
      "UPDATE categories SET lifecycle_changed_at = ? WHERE id = 'category-dining'",
      "2026-08-18T08:00:00.000Z",
    );
    await insertBudgetAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 0,
    });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id,
        is_recurring, description, created_at, updated_at
      ) VALUES (
        'transaction-aed', 'expense', 1000, 'AED', '2026-08-10',
        'account-aed', 'category-travel', 0, '', ?, ?
      )`,
      "2026-08-10T08:00:00.000Z",
      "2026-08-10T08:00:00.000Z",
    );
    const budgeting = createBudgetingCoordinator(database);
    await budgeting.createEnvelope({
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

    await expect(
      budgeting.getEnvelopeFormOptions({ currency: "USD", period: "2026-08" }),
    ).resolves.toEqual([
      {
        id: "category-dining",
        name: "Dining",
        icon: "🏷️",
        color: "#B48A7B",
        mappedEnvelopeId: null,
        requiresConfirmation: true,
        eligible: true,
        ineligibilityReason: null,
      },
      {
        id: "category-groceries",
        name: "Groceries",
        icon: "🏷️",
        color: "#B48A7B",
        mappedEnvelopeId: "envelope-food",
        requiresConfirmation: false,
        eligible: true,
        ineligibilityReason: null,
      },
      {
        id: "category-travel",
        name: "Travel",
        icon: "🏷️",
        color: "#B48A7B",
        mappedEnvelopeId: null,
        requiresConfirmation: false,
        eligible: false,
        ineligibilityReason: "incompatible-currency",
      },
    ]);
  });

  it("rejects income, archived, and incompatible-currency Category Mappings", async () => {
    const database = await setupWorkspace();
    await insertCategory(database, { id: "category-income", name: "Salary" });
    await insertCategory(database, { id: "category-archived", name: "Old" });
    await insertCategory(database, { id: "category-aed", name: "AED expense" });
    await database.runAsync("UPDATE categories SET type = 'income' WHERE id = 'category-income'");
    await database.runAsync(
      "UPDATE categories SET lifecycle = 'archived' WHERE id = 'category-archived'",
    );
    await insertBudgetAccount(database, {
      id: "account-aed",
      currency: "AED",
      initialBalance: 0,
    });
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, category_id,
        is_recurring, description, created_at, updated_at
      ) VALUES (
        'expense-aed', 'expense', 1000, 'AED', '2026-08-10',
        'account-aed', 'category-aed', 0, '', ?, ?
      )`,
      "2026-08-10T08:00:00.000Z",
      "2026-08-10T08:00:00.000Z",
    );
    const budgeting = createBudgetingCoordinator(database);
    const request = (id: string, categoryId: string) => ({
      id,
      currency: "USD",
      name: "Invalid",
      icon: "📦",
      color: "#8B9D83",
      categoryIds: [categoryId],
      positiveRollover: true,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    await expect(
      budgeting.createEnvelope(request("envelope-income", "category-income")),
    ).rejects.toThrow("Only active expense Categories can map to an Envelope.");
    await expect(
      budgeting.createEnvelope(request("envelope-archived", "category-archived")),
    ).rejects.toThrow("Only active expense Categories can map to an Envelope.");
    await expect(budgeting.createEnvelope(request("envelope-aed", "category-aed"))).rejects.toThrow(
      "Category category-aed is incompatible with USD.",
    );
    await expect(
      budgeting.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({ envelopes: [] });
  });

  it("normalizes a user-selected manual Envelope order", async () => {
    const database = await setupWorkspace();
    await insertCategory(database, { id: "category-food", name: "Food" });
    await insertCategory(database, { id: "category-bills", name: "Bills" });
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

    const projection = await budgeting.updateEnvelope({
      envelopeId: "envelope-bills",
      name: "Bills",
      icon: "📦",
      color: "#8B9D83",
      categoryIds: ["category-bills"],
      positiveRollover: true,
      sortOrder: 0,
      localDate: "2026-08-19",
      now: "2026-08-19T08:01:00.000Z",
    });

    expect(projection.envelopes.map(({ id, sortOrder }) => ({ id, sortOrder }))).toEqual([
      { id: "envelope-bills", sortOrder: 0 },
      { id: "envelope-food", sortOrder: 1 },
    ]);
  });
});

async function setupWorkspace(localDate = "2026-08-19"): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  databases.push(testDatabase);
  await insertBudgetAccount(testDatabase.database, {
    id: "account-main",
    initialBalance: 100_00,
  });
  await createBudgetingCoordinator(testDatabase.database).activateWorkspace({
    currency: "USD",
    fundingAccountIds: ["account-main"],
    localDate,
    now: "2026-08-19T07:00:00.000Z",
  });
  return testDatabase.database;
}

async function insertCategory(
  database: SQLiteDatabase,
  input: { id: string; name: string },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'expense', '#B48A7B', '🏷️', NULL, 0, ?, ?)`,
    input.id,
    input.name,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}
