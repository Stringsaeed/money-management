import { afterEach, describe, expect, it } from "@jest/globals";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";

import {
  activateRouteWorkspace,
  cleanupWorkspaceRouteTests,
  renderWorkspaceRoute,
  setupRouteDatabase,
  useRouteDatabase,
} from "@/tests/envelopes/workspace-support";

afterEach(cleanupWorkspaceRouteTests);

describe("Envelope workspace route status and selection", () => {
  it("shows accessible loading and empty workspace states", async () => {
    useRouteDatabase({
      getAllAsync: () => new Promise(() => undefined),
    } as unknown as SQLiteDatabase);
    const loadingRoute = await renderWorkspaceRoute({ prefetch: false });
    expect(screen.getByLabelText("Loading currency workspaces")).toBeOnTheScreen();
    loadingRoute.unmount();

    await setupRouteDatabase();
    await renderWorkspaceRoute();
    expect(await screen.findByText("No currency workspace yet")).toBeOnTheScreen();
  });

  it("shows actionable workspace and projection errors instead of zero values", async () => {
    useRouteDatabase({
      getAllAsync: async () => {
        throw new Error("forced workspace failure");
      },
    } as unknown as SQLiteDatabase);
    const errorRoute = await renderWorkspaceRoute({ prefetch: false });
    expect(await screen.findByText("Currency workspaces are unavailable")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Retry currency workspaces" })).toBeOnTheScreen();
    errorRoute.unmount();

    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    const selection = await createBudgetingCoordinator(database).getWorkspaceSelection();
    useRouteDatabase({
      getFirstAsync: async () => {
        throw new Error("forced projection failure");
      },
    } as unknown as SQLiteDatabase);
    await renderWorkspaceRoute({ selection });
    expect(await screen.findByText("Monthly budget is unavailable")).toBeOnTheScreen();
    expect(screen.queryByText("$0.00")).not.toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Retry monthly budget" })).toBeOnTheScreen();
  });

  it("exposes one currency workspace as the accessible selection", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await renderWorkspaceRoute();
    expect(
      (await screen.findByRole("radio", { name: "USD currency workspace" })).props
        .accessibilityState,
    ).toEqual({ disabled: false, selected: true });
  });

  it("persists selection among workspaces without combining their Money", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await activateRouteWorkspace(database, "AED", 500_00);
    await createBudgetingCoordinator(database).setHomeCurrency({ currency: "USD" });
    await renderWorkspaceRoute();

    const aedWorkspace = await screen.findByRole("radio", { name: "AED currency workspace" });
    await act(async () => fireEvent.press(aedWorkspace));
    await waitFor(() => {
      expect(
        screen.getByRole("radio", { name: "AED currency workspace" }).props.accessibilityState,
      ).toEqual({ disabled: false, selected: true });
    });
  });
});
