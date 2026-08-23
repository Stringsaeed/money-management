import { afterEach, describe, expect, it } from "@jest/globals";

import { insertBudgetAccount } from "@/modules/budgeting/budgeting-test-utils";

import { createBudgetingCoordinator } from "./budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Envelope resources", () => {
  it("creates an Envelope with Mappings and Rollover preference atomically", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-groceries", "Groceries"],
      ["category-dining", "Dining"],
    ]);

    const projection = await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-groceries", "category-dining"],
      positiveRollover: false,
    });

    expect(projection.envelopes).toEqual([
      expect.objectContaining({
        id: "envelope-food",
        currency: "USD",
        name: "Food",
        categoryIds: ["category-dining", "category-groceries"],
        positiveRollover: false,
        availableMoney: { currency: "USD", amountMinor: 0 },
        assignedMoney: { currency: "USD", amountMinor: 0 },
        netSpent: { currency: "USD", amountMinor: 0 },
      }),
    ]);
  });

  it("rolls back the complete Envelope when a setting cannot persist", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [["category-groceries", "Groceries"]]);
    await database.execAsync(`
      CREATE TRIGGER fail_rollover_setting
      BEFORE INSERT ON rollover_settings
      BEGIN
        SELECT RAISE(ABORT, 'forced rollover failure');
      END;
    `);

    await expect(
      createTestEnvelope(database, {
        id: "envelope-food",
        name: "Food",
        categoryIds: ["category-groceries"],
      }),
    ).rejects.toThrow("forced rollover failure");
    await expectProjectionEnvelopes(database, []);
  });

  it("lists active expense Categories with complete mapping eligibility", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-groceries", "Groceries"],
      ["category-dining", "Dining"],
      ["category-travel", "Travel"],
      ["category-income", "Salary"],
      ["category-archived", "Old"],
    ]);
    await database.runAsync("UPDATE categories SET type = 'income' WHERE id = 'category-income'");
    await database.runAsync(
      "UPDATE categories SET lifecycle = 'archived' WHERE id = 'category-archived'",
    );
    await database.runAsync(
      "UPDATE categories SET lifecycle_changed_at = ? WHERE id = 'category-dining'",
      "2026-08-18T08:00:00.000Z",
    );
    await insertIncompatibleTransaction(database, "category-travel");
    await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries"],
    });

    const options = await createBudgetingCoordinator(database).getEnvelopeFormOptions({
      currency: "USD",
      period: "2026-08",
    });
    expect(options).toEqual([
      expect.objectContaining({
        id: "category-dining",
        requiresConfirmation: true,
        eligible: true,
      }),
      expect.objectContaining({
        id: "category-groceries",
        mappedEnvelopeId: "envelope-food",
        eligible: true,
      }),
      expect.objectContaining({
        id: "category-travel",
        eligible: false,
        ineligibilityReason: "incompatible-currency",
      }),
    ]);
  });

  it("rejects income, archived, and incompatible-currency Category Mappings", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-income", "Salary"],
      ["category-archived", "Old"],
      ["category-aed", "AED expense"],
    ]);
    await database.runAsync("UPDATE categories SET type = 'income' WHERE id = 'category-income'");
    await database.runAsync(
      "UPDATE categories SET lifecycle = 'archived' WHERE id = 'category-archived'",
    );
    await insertIncompatibleTransaction(database, "category-aed");

    await expectInvalidCategory(database, "category-income", "Only active expense Categories");
    await expectInvalidCategory(database, "category-archived", "Only active expense Categories");
    await expectInvalidCategory(database, "category-aed", "incompatible with USD");
    await expectProjectionEnvelopes(database, []);
  });

  it("normalizes a user-selected manual Envelope order", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-food", "Food"],
      ["category-bills", "Bills"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-food"],
    });
    await createTestEnvelope(database, {
      id: "envelope-bills",
      name: "Bills",
      categoryIds: ["category-bills"],
    });

    const projection = await createBudgetingCoordinator(database).updateEnvelope({
      envelopeId: "envelope-bills",
      name: "Bills",
      icon: "📦",
      color: "#8B9D83",
      categoryIds: ["category-bills"],
      changedCategoryIds: [],
      positiveRollover: true,
      sortOrder: 0,
      localDate: "2026-08-19",
      now: "2026-08-19T08:01:00.000Z",
    });
    expect(projection.envelopes.map(({ id, sortOrder }) => [id, sortOrder])).toEqual([
      ["envelope-bills", 0],
      ["envelope-food", 1],
    ]);
  });
});

async function insertIncompatibleTransaction(
  database: Parameters<typeof createBudgetingCoordinator>[0],
  categoryId: string,
) {
  await insertBudgetAccount(database, {
    id: `account-aed-${categoryId}`,
    currency: "AED",
    initialBalance: 0,
  });
  await database.runAsync(
    `INSERT INTO transactions (
      id, type, amount, currency, date, account_id, category_id,
      is_recurring, description, created_at, updated_at
    ) VALUES (?, 'expense', 1000, 'AED', '2026-08-10', ?, ?, 0, '', ?, ?)`,
    `transaction-${categoryId}`,
    `account-aed-${categoryId}`,
    categoryId,
    "2026-08-10T08:00:00.000Z",
    "2026-08-10T08:00:00.000Z",
  );
}

async function expectInvalidCategory(
  database: Parameters<typeof createBudgetingCoordinator>[0],
  categoryId: string,
  message: string,
) {
  await expect(
    createTestEnvelope(database, {
      id: `envelope-${categoryId}`,
      name: "Invalid",
      categoryIds: [categoryId],
    }),
  ).rejects.toThrow(message);
}

async function expectProjectionEnvelopes(
  database: Parameters<typeof createBudgetingCoordinator>[0],
  envelopes: readonly unknown[],
) {
  await expect(
    createBudgetingCoordinator(database).getProjection({ currency: "USD", period: "2026-08" }),
  ).resolves.toMatchObject({ envelopes });
}
