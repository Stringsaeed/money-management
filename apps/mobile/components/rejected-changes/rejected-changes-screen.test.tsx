import { render, screen, waitFor } from "@testing-library/react-native";

import { RejectedChangesScreen } from "@/components/rejected-changes/rejected-changes-screen";
import type { RejectedChange } from "@/lib/sync/outbox";

const mockChanges: { current: readonly RejectedChange[] } = { current: [] };
const mockDiscard = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock("@/hooks/use-rejected-changes", () => ({
  useRejectedChanges: () => ({
    changes: mockChanges.current,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    discard: mockDiscard,
    resubmit: jest.fn(),
  }),
}));

function makeChange(overrides: Partial<RejectedChange> = {}): RejectedChange {
  return {
    commandId: "cmd-1",
    householdId: "household-1",
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

describe("RejectedChangesScreen", () => {
  it("renders the inbox title and one entry per rejected change", async () => {
    mockChanges.current = [
      makeChange(),
      makeChange({ commandId: "cmd-2", kind: "account.create" }),
    ];

    await render(<RejectedChangesScreen />);

    expect(screen.getByText(/Rejected Changes/)).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getByText(/Record transaction · Coffee/)).toBeOnTheScreen();
      expect(screen.getByText("New account")).toBeOnTheScreen();
    });
  });

  it("shows the empty state when nothing was rejected", async () => {
    mockChanges.current = [];

    await render(<RejectedChangesScreen />);

    expect(screen.getByText("Nothing rejected")).toBeOnTheScreen();
  });
});
