import { afterEach, describe, expect, it } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import {
  activateRouteWorkspace,
  cleanupWorkspaceRouteTests,
  createRouteEnvelope,
  insertRouteCategory,
  renderWorkspaceRoute,
  setupRouteDatabase,
} from "@/tests/envelopes/workspace-support";

afterEach(cleanupWorkspaceRouteTests);

describe("Envelope workspace schedule", () => {
  it("renames an Envelope without rewriting later Mapping boundaries", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    for (const [id, name] of [
      ["category-timeline", "Timeline"],
      ["category-a", "A base"],
      ["category-b", "B base"],
      ["category-c", "C base"],
    ]) {
      await insertRouteCategory(database, id, name);
    }
    await createRouteEnvelope(database, {
      id: "envelope-a",
      name: "A",
      categoryIds: ["category-a", "category-timeline"],
    });
    await createRouteEnvelope(database, {
      id: "envelope-b",
      name: "B",
      categoryIds: ["category-b"],
    });
    await createRouteEnvelope(database, {
      id: "envelope-c",
      name: "C",
      categoryIds: ["category-c"],
    });
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
    await renderWorkspaceRoute();

    await fireEvent.press(await screen.findByRole("button", { name: "Edit A Envelope" }));
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "A renamed");
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit A renamed Envelope" })).toBeOnTheScreen();
    });

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
  });
});
