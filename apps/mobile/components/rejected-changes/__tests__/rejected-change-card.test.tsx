import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { RejectedChangeCard } from "@/components/rejected-changes/rejected-change-card";
import type { RejectedChange } from "@/modules/powersync/rejected-changes";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

const mockOnEdit = jest.fn();
const mockOnDiscard = jest.fn();

function makeChange(overrides: Partial<RejectedChange> = {}): RejectedChange {
  return {
    commandId: "cmd-1",
    ledgerId: "household-1",
    kind: "transaction.create",
    rejectionKind: "invalid_intent",
    rejection: {
      kind: "invalid_intent",
      issues: [{ field: "amountMinor", message: "must be positive" }],
    },
    payload: { amountMinor: -50, description: "Coffee" },
    attempts: 1,
    createdAt: new Date("2026-08-24T10:30:00Z"),
    ...overrides,
  };
}

describe("RejectedChangeCard", () => {
  beforeEach(() => {
    mockOnEdit.mockReset();
    mockOnDiscard.mockReset();
  });

  it("shows command type, original intent, reason, and timestamp", async () => {
    await render(
      <RejectedChangeCard change={makeChange()} onEdit={mockOnEdit} onDiscard={mockOnDiscard} />,
    );

    expect(screen.getByText(/Record transaction · Coffee/)).toBeOnTheScreen();
    expect(screen.getByText(/amountMinor: must be positive/)).toBeOnTheScreen();
    expect(screen.getByText(/Aug 24 · /)).toBeOnTheScreen();
  });

  it("renders a human label per rejection kind", async () => {
    await render(
      <RejectedChangeCard
        change={makeChange({
          kind: "account.archive",
          rejectionKind: "forbidden",
          rejection: {
            kind: "forbidden",
            role: "viewer",
            requiredCapability: "commands:account.archive",
          },
        })}
        onEdit={mockOnEdit}
        onDiscard={mockOnDiscard}
      />,
    );
    expect(screen.getByText("🔒")).toBeOnTheScreen();
    expect(screen.getByText(/Your role \(viewer\) cannot do this/)).toBeOnTheScreen();
  });

  it("invokes onEdit and onDiscard", async () => {
    await render(
      <RejectedChangeCard change={makeChange()} onEdit={mockOnEdit} onDiscard={mockOnDiscard} />,
    );

    fireEvent.press(screen.getByTestId("rejected-edit-cmd-1"));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("rejected-discard-cmd-1"));
    await waitFor(() => expect(mockOnDiscard).toHaveBeenCalledTimes(1));
    expect(router.push).not.toHaveBeenCalled();
  });
});
