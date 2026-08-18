import { afterEach, describe, expect, it } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";

import {
  activateRouteWorkspace,
  cleanupWorkspaceRouteTests,
  createRouteEnvelope,
  insertRouteCategory,
  renderWorkspaceRoute,
  setupRouteDatabase,
} from "./workspace-test-support";

afterEach(cleanupWorkspaceRouteTests);

describe("Envelope workspace form", () => {
  it("creates an Envelope from the page-owned sheet and validates required fields", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await insertRouteCategory(database, "category-groceries", "Groceries");
    await renderWorkspaceRoute();

    await fireEvent.press(await screen.findByRole("button", { name: "New Envelope" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create Envelope" }));
    expect(await screen.findByText("Envelope name is required")).toBeOnTheScreen();
    expect(screen.getByText("Choose at least one active expense Category")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Food");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Groceries Category" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create Envelope" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Food Envelope" })).toBeOnTheScreen();
    });
    expect(screen.getByText("Available Money")).toBeOnTheScreen();
    expect(screen.getByText(/Assigned Money/)).toBeOnTheScreen();
    expect(screen.getByText(/Net Spent/)).toBeOnTheScreen();
  });

  it("dismisses the page-owned form without writing an Envelope", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await insertRouteCategory(database, "category-groceries", "Groceries");
    await renderWorkspaceRoute();
    await fireEvent.press(await screen.findByRole("button", { name: "New Envelope" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByPlaceholderText("e.g. Groceries")).not.toBeOnTheScreen();
    await expect(
      createBudgetingCoordinator(database).getProjection({ currency: "USD", period: "2026-08" }),
    ).resolves.toMatchObject({ envelopes: [] });
  });

  it("edits metadata without exposing mutable currency or moving Money", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await insertRouteCategory(database, "category-groceries", "Groceries");
    await createRouteEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries"],
    });
    await renderWorkspaceRoute();

    await fireEvent.press(await screen.findByRole("button", { name: "Edit Food Envelope" }));
    expect(screen.getByText("Currency can't be changed after creation.")).toBeOnTheScreen();
    const rollover = screen.getByRole("switch", {
      name: "Carry positive Available Money forward",
    });
    expect(rollover.props.accessibilityState).toEqual({ checked: true });
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Meals");
    await fireEvent.press(rollover);
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Meals Envelope" })).toBeOnTheScreen();
    });
    expect(screen.getByText("$100.00")).toBeOnTheScreen();
  });

  it("confirms and preserves a restored Category's scheduled Mapping", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await insertRouteCategory(database, "category-groceries", "Groceries");
    await insertRouteCategory(database, "category-dining", "Dining");
    await database.runAsync(
      "UPDATE categories SET lifecycle_changed_at = ? WHERE id = ?",
      "2026-08-18T08:00:00.000Z",
      "category-dining",
    );
    await createRouteEnvelope(database, {
      id: "envelope-food",
      name: "Food",
      categoryIds: ["category-groceries"],
    });
    await renderWorkspaceRoute();

    await fireEvent.press(await screen.findByRole("button", { name: "Edit Food Envelope" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Dining Category" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    expect(await screen.findByText(/Confirm restored Category category-dining/)).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("checkbox", { name: "Confirm future Mapping for Dining" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => expect(screen.queryByText("Edit Envelope")).not.toBeOnTheScreen());

    await fireEvent.press(screen.getByRole("button", { name: "Edit Food Envelope" }));
    expect(
      screen.getByRole("checkbox", { name: "Dining Category" }).props.accessibilityState,
    ).toMatchObject({ checked: true, disabled: false });
    expect(screen.getByText("Scheduled from 2026-09")).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Groceries"), "Food planning");
    await fireEvent.press(screen.getByRole("button", { name: "Save Envelope" }));
    await waitFor(() => expect(screen.queryByText("Edit Envelope")).not.toBeOnTheScreen());
    await expect(
      createBudgetingCoordinator(database).getProjection({ currency: "USD", period: "2026-09" }),
    ).resolves.toMatchObject({
      envelopes: [
        {
          id: "envelope-food",
          name: "Food planning",
          categoryIds: ["category-dining", "category-groceries"],
        },
      ],
    });
  });
});
