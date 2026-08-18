import { afterEach, describe, expect, it } from "@jest/globals";

import { archiveCategory, restoreCategory } from "@/modules/categories/category-lifecycle";

import { createBudgetingCoordinator } from "./budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("period-aware Envelope Mappings", () => {
  it("edits current and future mappings while preserving an earlier Budget Period", async () => {
    const database = await setupEnvelopeWorkspace("2026-07-12");
    await insertEnvelopeCategories(database, [
      ["category-groceries", "Groceries"],
      ["category-dining", "Dining"],
      ["category-utilities", "Utilities"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries", "category-dining"],
      localDate: "2026-07-12",
    });
    await createTestEnvelope(database, {
      id: "envelope-bills",
      name: "Bills",
      categoryIds: ["category-utilities"],
      localDate: "2026-07-12",
    });

    await createBudgetingCoordinator(database).updateEnvelope({
      envelopeId: "envelope-bills",
      name: "Monthly bills",
      icon: "🧾",
      color: "#B48A7B",
      categoryIds: ["category-utilities", "category-groceries"],
      positiveRollover: false,
      localDate: "2026-08-19",
      now: "2026-08-19T08:00:00.000Z",
    });

    await expectCategories(database, "2026-07", [
      ["envelope-food", ["category-dining", "category-groceries"]],
      ["envelope-bills", ["category-utilities"]],
    ]);
    await expectCategories(database, "2026-08", [
      ["envelope-food", ["category-dining"]],
      ["envelope-bills", ["category-groceries", "category-utilities"]],
    ]);
  });

  it("replaces a pre-existing future Mapping when creating an Envelope", async () => {
    const database = await setupEnvelopeWorkspace("2026-07-12");
    await insertEnvelopeCategories(database, [
      ["category-food", "Food"],
      ["category-dining", "Dining"],
      ["category-bills", "Bills"],
      ["category-travel", "Travel"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-food", "category-dining"],
      localDate: "2026-07-12",
    });
    await createTestEnvelope(database, {
      id: "envelope-bills",
      name: "Bills",
      categoryIds: ["category-bills"],
      localDate: "2026-07-12",
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

    await createTestEnvelope(database, {
      id: "envelope-travel",
      name: "Travel",
      icon: "✈️",
      categoryIds: ["category-travel", "category-dining"],
      confirmedRestoredCategoryIds: ["category-dining"],
    });

    const mappings = await database.getAllAsync<{ envelopeId: string }>(
      `SELECT envelope_id AS envelopeId
       FROM category_mappings
       WHERE category_id = ?
         AND effective_from_period <= ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
      "category-dining",
      "2026-09",
      "2026-09",
    );
    expect(mappings).toEqual([{ envelopeId: "envelope-travel" }]);
  });
});

async function expectCategories(
  database: Parameters<typeof createBudgetingCoordinator>[0],
  period: string,
  expected: readonly (readonly [id: string, categoryIds: readonly string[]])[],
) {
  const projection = await createBudgetingCoordinator(database).getProjection({
    currency: "USD",
    period,
  });
  expect(projection?.envelopes.map(({ id, categoryIds }) => [id, categoryIds])).toEqual(expected);
}
