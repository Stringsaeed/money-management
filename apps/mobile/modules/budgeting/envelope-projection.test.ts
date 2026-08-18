import { afterEach, describe, expect, it } from "@jest/globals";

import { archiveCategory } from "@/modules/categories/category-lifecycle";

import { createBudgetingCoordinator } from "./budgeting";
import {
  closeEnvelopeTestDatabases,
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "./envelope-test-support";

afterEach(closeEnvelopeTestDatabases);

describe("Envelope projection", () => {
  it("preserves archived Category mapping facts without flagging archived Envelopes", async () => {
    const database = await setupEnvelopeWorkspace();
    await insertEnvelopeCategories(database, [["category-old", "Old plan"]]);
    await createTestEnvelope(database, {
      id: "envelope-old",
      name: "Old",
      categoryIds: ["category-old"],
    });

    await archiveCategory(database, {
      categoryId: "category-old",
      localDate: "2026-08-19",
      now: "2026-08-19T09:00:00.000Z",
    });

    const coordinator = createBudgetingCoordinator(database);
    await expect(
      coordinator.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({
      envelopes: [
        {
          id: "envelope-old",
          categoryIds: ["category-old"],
          health: { status: "needs_attention" },
        },
      ],
    });

    await database.runAsync(
      "UPDATE envelopes SET lifecycle = 'archived' WHERE id = 'envelope-old'",
    );
    await expect(
      coordinator.getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({
      archivedEnvelopes: [
        {
          id: "envelope-old",
          categoryIds: ["category-old"],
          health: { status: "ready" },
        },
      ],
    });
  });
});
