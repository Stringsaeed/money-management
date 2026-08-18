import { afterEach, describe, expect, it } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { archiveCategory } from "@/modules/categories/category-lifecycle";

import {
  activateRouteWorkspace,
  cleanupWorkspaceRouteTests,
  createRouteEnvelope,
  insertRouteCategory,
  renderWorkspaceRoute,
  setupRouteDatabase,
} from "@/tests/envelopes/workspace-support";

afterEach(cleanupWorkspaceRouteTests);

describe("Envelope workspace list", () => {
  it("sorts Needs-Attention first and exposes archived Envelopes separately", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    for (const [id, name] of [
      ["category-ready", "Ready"],
      ["category-attention", "Attention"],
      ["category-archived", "Archived"],
    ]) {
      await insertRouteCategory(database, id, name);
    }
    for (const [id, name, categoryId] of [
      ["envelope-ready", "Ready plan", "category-ready"],
      ["envelope-attention", "Attention plan", "category-attention"],
      ["envelope-archived", "Archived plan", "category-archived"],
    ]) {
      await createRouteEnvelope(database, { id, name, categoryIds: [categoryId] });
    }
    await archiveCategory(database, {
      categoryId: "category-attention",
      localDate: "2026-08-19",
      now: "2026-08-19T08:01:00.000Z",
    });
    await database.runAsync(
      "UPDATE envelopes SET lifecycle = 'archived' WHERE id = 'envelope-archived'",
    );

    await renderWorkspaceRoute();
    await screen.findByRole("button", { name: "Edit Attention plan Envelope" });
    expect(editRowLabels()).toEqual(["Edit Attention plan Envelope", "Edit Ready plan Envelope"]);
    expect(screen.getByText(/Needs Attention/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "View archived Envelopes" }));
    expect(screen.getByText("Archived plan")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Edit Archived plan Envelope" }),
    ).not.toBeOnTheScreen();
  });

  it("changes manual order from the edit sheet", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await insertRouteCategory(database, "category-food", "Food");
    await insertRouteCategory(database, "category-bills", "Bills");
    await createRouteEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-food"],
    });
    await createRouteEnvelope(database, {
      id: "envelope-bills",
      name: "Bills",
      categoryIds: ["category-bills"],
    });

    await renderWorkspaceRoute();
    await fireEvent.press(await screen.findByRole("button", { name: "Edit Bills Envelope" }));
    const earlier = screen.getByRole("button", { name: "Move Envelope earlier" });
    expect(earlier.props.accessibilityState).toEqual({ disabled: false });
    await fireEvent.press(earlier);
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => {
      expect(editRowLabels()).toEqual(["Edit Bills Envelope", "Edit Food Envelope"]);
    });
  });
});

function editRowLabels(): (string | undefined)[] {
  return screen
    .getAllByRole("button")
    .map(({ props }) => props.accessibilityLabel as string | undefined)
    .filter((label) => label?.startsWith("Edit "));
}
