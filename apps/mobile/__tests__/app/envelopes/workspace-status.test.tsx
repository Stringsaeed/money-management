import { afterEach, describe, expect, it } from "@jest/globals";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";

import {
  activateRouteWorkspace,
  cleanupWorkspaceRouteTests,
  createRouteEnvelope,
  insertRouteCategory,
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

  it("previews, validates, cancels, and commits Move Money through the workspace route", async () => {
    const { database } = await setupRouteDatabase();
    await activateRouteWorkspace(database, "USD", 100_00);
    await insertRouteCategory(database, "category-food", "Food");
    await insertRouteCategory(database, "category-fun", "Fun");
    await createRouteEnvelope(database, {
      categoryIds: ["category-food"],
      id: "envelope-food",
      name: "Food",
    });
    await createRouteEnvelope(database, {
      categoryIds: ["category-fun"],
      id: "envelope-fun",
      name: "Fun",
    });
    await renderWorkspaceRoute();

    await fireEvent.press(await screen.findByRole("button", { name: "Move Money" }));
    expect(screen.getByLabelText("Move Money source")).toBeOnTheScreen();
    expect(screen.getByLabelText("Move Money destination")).toBeOnTheScreen();
    expect(screen.getByLabelText("Move Money amount")).toBeOnTheScreen();
    expect(screen.getByLabelText("Move Money period")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText("Move Money amount"), "0");
    await fireEvent.press(screen.getByRole("button", { name: "Preview Move Money" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/positive integer/);

    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByLabelText("Move Money source")).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Move Money" }));
    await fireEvent.changeText(screen.getByLabelText("Move Money amount"), "2500");
    await fireEvent.press(screen.getByRole("button", { name: "Preview Move Money" }));
    expect(await screen.findByText("Source 10000 → 7500")).toBeOnTheScreen();
    expect(screen.getByText("Destination 0 → 2500")).toBeOnTheScreen();

    const commitButton = screen.getAllByRole("button", { name: "Move Money" }).at(-1);
    await fireEvent.press(commitButton!);
    await waitFor(() => expect(screen.queryByLabelText("Move Money source")).not.toBeOnTheScreen());
    await waitFor(() => expect(screen.getByText("$75.00")).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole("button", { name: "Move Money" }));
    const originalAssignment = await screen.findByRole("button", {
      name: /Assignment assignment-.*original/,
    });
    await fireEvent.press(originalAssignment);
    expect(screen.getByText(/Correcting Assignment/)).toBeOnTheScreen();
    expect(screen.getByLabelText("Move Money amount").props.value).toBe("2500");
    await fireEvent.changeText(screen.getByLabelText("Move Money amount"), "2000");
    await fireEvent.press(screen.getByRole("button", { name: "Preview Move Money" }));
    expect(await screen.findByText("Source 10000 → 8000")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Correct Move Money" }));
    await waitFor(() => expect(screen.queryByLabelText("Move Money source")).not.toBeOnTheScreen());

    await fireEvent.press(screen.getByRole("button", { name: "Move Money" }));
    expect(await screen.findByText(/reversal · 2500 minor units/)).toBeOnTheScreen();
    expect(screen.getByText(/replacement · 2000 minor units/)).toBeOnTheScreen();
    const sourcePicker = screen.getByLabelText("Move Money source");
    const destinationPicker = screen.getByLabelText("Move Money destination");
    await fireEvent.press(within(sourcePicker).getByRole("button", { name: "Food" }));
    await fireEvent.press(
      within(destinationPicker).getByRole("button", { name: "Unassigned Money" }),
    );
    await fireEvent.changeText(screen.getByLabelText("Move Money amount"), "1000");
    await fireEvent.press(screen.getByRole("button", { name: "Preview Move Money" }));
    expect(await screen.findByText("Source 2000 → 1000")).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole("button", { name: "Move Money" }).at(-1)!);
    await waitFor(() => expect(screen.queryByLabelText("Move Money source")).not.toBeOnTheScreen());

    await fireEvent.press(screen.getByRole("button", { name: "Move Money" }));
    const envelopeSourcePicker = screen.getByLabelText("Move Money source");
    const envelopeDestinationPicker = screen.getByLabelText("Move Money destination");
    await fireEvent.press(within(envelopeSourcePicker).getByRole("button", { name: "Food" }));
    await fireEvent.press(within(envelopeDestinationPicker).getByRole("button", { name: "Fun" }));
    await fireEvent.changeText(screen.getByLabelText("Move Money amount"), "500");
    await fireEvent.press(screen.getByRole("button", { name: "Preview Move Money" }));
    expect(await screen.findByText("Destination 0 → 500")).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole("button", { name: "Move Money" }).at(-1)!);
    await waitFor(() => expect(screen.queryByLabelText("Move Money source")).not.toBeOnTheScreen());
  });
});
