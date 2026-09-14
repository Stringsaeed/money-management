import { afterEach, describe, expect, it } from "@jest/globals";

import { insertBudgetAccount } from "@/modules/budgeting/budgeting-test-utils";

import { createBudgetingCoordinator } from "../budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "../envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Envelope Mapping invariants", () => {
  it("rolls back an edit that would leave another active Envelope without a Category", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-groceries", "Groceries"],
      ["category-utilities", "Utilities"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries"],
    });
    await createTestEnvelope(database, {
      id: "envelope-bills",
      name: "Bills",
      categoryIds: ["category-utilities"],
    });

    await expect(
      updateTarget(database, ["category-utilities", "category-groceries"]),
    ).rejects.toThrow("Envelope envelope-food requires at least one active expense Category.");
    await expectCategories(database, "USD", "2026-08", [
      ["envelope-food", ["category-groceries"]],
      ["envelope-bills", ["category-utilities"]],
    ]);
  });

  it("rolls back a reassignment that empties an Envelope in another currency", async () => {
    const database = await setupEnvelopeWorkspace();
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
    await insertEnvelopeCategories(database, [
      ["category-usd", "USD"],
      ["category-aed", "AED"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-usd",
      name: "USD Envelope",
      categoryIds: ["category-usd"],
    });
    await createTestEnvelope(database, {
      id: "envelope-aed",
      name: "AED Envelope",
      currency: "AED",
      categoryIds: ["category-aed"],
    });

    await expect(
      createBudgetingCoordinator(database).updateEnvelope({
        envelopeId: "envelope-usd",
        name: "USD Envelope",
        icon: "💵",
        color: "#8B9D83",
        categoryIds: ["category-usd", "category-aed"],
        changedCategoryIds: ["category-aed"],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:02:00.000Z",
      }),
    ).rejects.toThrow("Envelope envelope-aed requires at least one active expense Category.");
    await expectCategories(database, "AED", "2026-08", [["envelope-aed", ["category-aed"]]]);
  });

  it("checks a displaced source at every later mapping boundary", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-moving", "Moving"],
      ["category-temporary", "Temporary"],
      ["category-target", "Target"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-source",
      name: "Source",
      categoryIds: ["category-moving", "category-temporary"],
    });
    await createTestEnvelope(database, {
      id: "envelope-target",
      name: "Target",
      categoryIds: ["category-target"],
    });
    await database.runAsync(
      `UPDATE category_mappings SET effective_to_period = '2026-09'
       WHERE category_id = 'category-temporary'`,
    );

    await expect(
      createBudgetingCoordinator(database).updateEnvelope({
        envelopeId: "envelope-target",
        name: "Target",
        icon: "🎯",
        color: "#8B9D83",
        categoryIds: ["category-target", "category-moving"],
        changedCategoryIds: ["category-moving"],
        positiveRollover: true,
        localDate: "2026-08-19",
        now: "2026-08-19T08:02:00.000Z",
      }),
    ).rejects.toThrow("Envelope envelope-source requires at least one active expense Category.");
    await expectCategories(database, "USD", "2026-10", [
      ["envelope-source", ["category-moving"]],
      ["envelope-target", ["category-target"]],
    ]);
  });
});

function updateTarget(
  database: Parameters<typeof createBudgetingCoordinator>[0],
  categoryIds: string[],
) {
  return createBudgetingCoordinator(database).updateEnvelope({
    envelopeId: "envelope-bills",
    name: "Bills",
    icon: "🧾",
    color: "#B48A7B",
    categoryIds,
    changedCategoryIds: ["category-groceries"],
    positiveRollover: true,
    localDate: "2026-08-19",
    now: "2026-08-19T08:01:00.000Z",
  });
}

async function expectCategories(
  database: Parameters<typeof createBudgetingCoordinator>[0],
  currency: string,
  period: string,
  expected: readonly (readonly [id: string, categoryIds: readonly string[]])[],
) {
  const projection = await createBudgetingCoordinator(database).getProjection({ currency, period });
  expect(projection?.envelopes.map(({ id, categoryIds }) => [id, categoryIds])).toEqual(expected);
}
