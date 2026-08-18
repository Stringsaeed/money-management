import { afterEach, describe, expect, it } from "@jest/globals";

import { createBudgetingCoordinator } from "./budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Envelope order", () => {
  it("normalizes active order gaps before an Envelope edit", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-first", "First"],
      ["category-second", "Second"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-first",
      name: "First",
      categoryIds: ["category-first"],
    });
    await createTestEnvelope(database, {
      id: "envelope-second",
      name: "Second",
      categoryIds: ["category-second"],
    });
    await database.runAsync(
      "UPDATE envelopes SET lifecycle = 'archived' WHERE id = 'envelope-first'",
    );

    const projection = await createBudgetingCoordinator(database).updateEnvelope({
      envelopeId: "envelope-second",
      name: "Second updated",
      icon: "📦",
      color: "#8B9D83",
      categoryIds: ["category-second"],
      changedCategoryIds: [],
      positiveRollover: true,
      sortOrder: 1,
      localDate: "2026-08-19",
      now: "2026-08-19T09:00:00.000Z",
    });

    expect(projection.envelopes).toEqual([
      expect.objectContaining({ id: "envelope-second", sortOrder: 0 }),
    ]);
  });
});
