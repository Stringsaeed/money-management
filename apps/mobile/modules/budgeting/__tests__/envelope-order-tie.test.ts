import { afterEach, describe, expect, it } from "@jest/globals";

import { createBudgetingCoordinator } from "../budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "../envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Envelope order tie-breaker", () => {
  it("uses the persistence tie-breaker for duplicate manual orders", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [
      ["category-a", "A"],
      ["category-b", "B"],
    ]);
    await createTestEnvelope(database, {
      id: "envelope-a",
      name: "Zulu",
      categoryIds: ["category-a"],
    });
    await createTestEnvelope(database, {
      id: "envelope-b",
      name: "Alpha",
      categoryIds: ["category-b"],
    });
    await database.runAsync("UPDATE envelopes SET sort_order = 0");

    const projection = await createBudgetingCoordinator(database).getProjection({
      currency: "USD",
      period: "2026-08",
    });
    expect(projection?.envelopes.map(({ id, sortOrder }) => [id, sortOrder])).toEqual([
      ["envelope-a", 0],
      ["envelope-b", 1],
    ]);
  });
});
