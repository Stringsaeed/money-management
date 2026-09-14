import { afterEach, describe, expect, it } from "@jest/globals";

import { archiveCategory, restoreCategory } from "@/modules/categories/category-lifecycle";

import { createBudgetingCoordinator } from "../budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "../envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("restored Envelope Category Mappings", () => {
  it("preserves current attribution and a confirmed future Mapping across metadata edits", async () => {
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
    await archiveAndRestore(database, "category-dining");
    const budgeting = createBudgetingCoordinator(database);
    const update = {
      envelopeId: "envelope-bills",
      name: "Bills",
      icon: "🧾",
      color: "#8B9D83",
      categoryIds: ["category-utilities", "category-dining"],
      changedCategoryIds: ["category-dining"],
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
    await expectEnvelopeCategories(database, "2026-08", [
      ["envelope-food", ["category-dining", "category-groceries"]],
      ["envelope-bills", ["category-utilities"]],
    ]);
    await expectEnvelopeCategories(database, "2026-09", [
      ["envelope-food", ["category-groceries"]],
      ["envelope-bills", ["category-dining", "category-utilities"]],
    ]);

    await budgeting.updateEnvelope({
      ...update,
      name: "Household bills",
      changedCategoryIds: [],
      now: "2026-08-19T08:01:00.000Z",
    });
    await expectEnvelopeCategories(database, "2026-09", [
      ["envelope-food", ["category-groceries"]],
      ["envelope-bills", ["category-dining", "category-utilities"]],
    ]);
  });

  it("requires confirmation before restoring a Category to its previous Envelope", async () => {
    const database = await setupEnvelopeWorkspace("2026-07-12");
    await insertEnvelopeCategories(database, [
      ["category-groceries", "Groceries"],
      ["category-dining", "Dining"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries", "category-dining"],
      localDate: "2026-07-12",
    });
    await archiveAndRestore(database, "category-dining");
    const budgeting = createBudgetingCoordinator(database);
    const update = {
      envelopeId: "envelope-food",
      name: "Food",
      icon: "🍲",
      color: "#B48A7B",
      categoryIds: ["category-groceries", "category-dining"],
      changedCategoryIds: ["category-dining"],
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
    await expectEnvelopeCategories(database, "2026-09", [
      ["envelope-food", ["category-dining", "category-groceries"]],
    ]);
  });
});

async function archiveAndRestore(
  database: Parameters<typeof archiveCategory>[0],
  categoryId: string,
) {
  await archiveCategory(database, {
    categoryId,
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await restoreCategory(database, {
    categoryId,
    now: "2026-08-18T08:01:00.000Z",
  });
}

async function expectEnvelopeCategories(
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
