import { afterEach, describe, expect, it } from "@jest/globals";

import { createBudgetingCoordinator } from "../budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "../envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Envelope schedule idempotence", () => {
  it("preserves a complete future Mapping timeline during metadata edits", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-timeline", "Timeline"],
      ["category-a", "A base"],
      ["category-b", "B base"],
      ["category-c", "C base"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-a",
      name: "A",
      categoryIds: ["category-a", "category-timeline"],
    });
    await createTestEnvelope(database, {
      id: "envelope-b",
      name: "B",
      categoryIds: ["category-b"],
    });
    await createTestEnvelope(database, {
      id: "envelope-c",
      name: "C",
      categoryIds: ["category-c"],
    });
    await installTimeline(database);

    const budgeting = createBudgetingCoordinator(database);
    await budgeting.updateEnvelope({
      envelopeId: "envelope-a",
      name: "A renamed",
      icon: "🅰️",
      color: "#8B9D83",
      categoryIds: ["category-a", "category-timeline"],
      changedCategoryIds: [],
      positiveRollover: true,
      sortOrder: 0,
      localDate: "2026-08-19",
      now: "2026-08-19T10:00:00.000Z",
    });
    await budgeting.updateEnvelope({
      envelopeId: "envelope-b",
      name: "B renamed",
      icon: "🅱️",
      color: "#8B9D83",
      categoryIds: ["category-b", "category-timeline"],
      changedCategoryIds: [],
      positiveRollover: true,
      sortOrder: 1,
      localDate: "2026-08-19",
      now: "2026-08-19T10:01:00.000Z",
    });

    await expectTimeline(database);
  });
});

async function installTimeline(
  database: Parameters<typeof createBudgetingCoordinator>[0],
): Promise<void> {
  await database.runAsync(
    "UPDATE category_mappings SET effective_to_period = '2026-08' WHERE category_id = ?",
    "category-timeline",
  );
  await database.runAsync(
    `INSERT INTO category_mappings (
      category_id, envelope_id, effective_from_period, effective_to_period, created_at
    ) VALUES (?, ?, '2026-09', '2026-09', ?), (?, ?, '2026-10', NULL, ?)`,
    "category-timeline",
    "envelope-b",
    "2026-08-19T09:00:00.000Z",
    "category-timeline",
    "envelope-c",
    "2026-08-19T09:01:00.000Z",
  );
}

async function expectTimeline(
  database: Parameters<typeof createBudgetingCoordinator>[0],
): Promise<void> {
  await expect(
    database.getAllAsync(
      `SELECT envelope_id AS envelopeId, effective_from_period AS fromPeriod,
         effective_to_period AS throughPeriod
       FROM category_mappings
       WHERE category_id = ?
       ORDER BY effective_from_period`,
      "category-timeline",
    ),
  ).resolves.toEqual([
    { envelopeId: "envelope-a", fromPeriod: "2026-08", throughPeriod: "2026-08" },
    { envelopeId: "envelope-b", fromPeriod: "2026-09", throughPeriod: "2026-09" },
    { envelopeId: "envelope-c", fromPeriod: "2026-10", throughPeriod: null },
  ]);
}
