import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";

import { CategoryRow } from "../categories/category-row";
import { confirmLedgerDeletion } from "../delete-confirmation";

const category = {
  id: "category-1",
  ledgerId: "personal:guest-1",
  name: "Food",
  kind: "expense" as const,
  color: "#4a8f69",
  icon: "receipt",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};

describe("category destructive actions", () => {
  it("exposes explicit edit and delete actions without deleting on render", async () => {
    const onDelete = jest.fn();
    await render(
      <CategoryRow
        category={category}
        onArchive={jest.fn()}
        onDelete={onDelete}
        onEdit={jest.fn()}
        onRestore={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit" })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("waits for the destructive confirmation before invoking deletion", () => {
    const alert = jest.spyOn(Alert, "alert");
    const onConfirm = jest.fn();

    confirmLedgerDeletion("category", "Food", onConfirm);
    const categoryActions = alert.mock.calls[0]?.[2];
    if (Array.isArray(categoryActions)) categoryActions[0]?.onPress?.();
    expect(onConfirm).not.toHaveBeenCalled();
    if (Array.isArray(categoryActions)) categoryActions[1]?.onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[1]).toContain("linked transaction and recurring schedule");

    confirmLedgerDeletion("account", "Checking", onConfirm);
    expect(alert.mock.calls[1]?.[1]).toContain("transfers to or from this account");
  });
});
