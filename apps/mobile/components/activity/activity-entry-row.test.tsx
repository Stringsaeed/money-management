import { fireEvent, render, screen } from "@testing-library/react-native";

import { ActivityEntryRow } from "@/components/activity/activity-entry-row";
import type { ActivityEntry } from "@/hooks/use-activity";

const ENTRY: ActivityEntry = {
  seq: 7,
  commandId: "cmd-7",
  userId: "user-2",
  userName: "Member",
  createdAt: "2026-08-20T14:05:00.000Z",
  effects: ["ledger", "balances"],
  summary: "Updated the ledger and account balances",
};

describe("ActivityEntryRow", () => {
  it("shows user name, action summary, timestamp, and affected entities", async () => {
    await render(<ActivityEntryRow entry={ENTRY} />);

    expect(screen.getByText("Updated the ledger and account balances")).toBeOnTheScreen();
    expect(screen.getByText(/Member/)).toBeOnTheScreen();
    expect(screen.getByText("ledger")).toBeOnTheScreen();
    expect(screen.getByText("balances")).toBeOnTheScreen();
  });

  it("calls onPress with the tapped entry", async () => {
    const onPress = jest.fn();
    await render(<ActivityEntryRow entry={ENTRY} onPress={onPress} />);

    fireEvent.press(screen.getByLabelText("Member: Updated the ledger and account balances"));

    expect(onPress).toHaveBeenCalledWith(ENTRY);
  });

  it("renders without a press handler for read-only use", async () => {
    await render(<ActivityEntryRow entry={{ ...ENTRY, effects: [] }} />);
    expect(
      screen.getByLabelText("Member: Updated the ledger and account balances"),
    ).toBeOnTheScreen();
  });
});
