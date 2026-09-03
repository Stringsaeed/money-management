import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { RejectedChangeEditScreen } from "@/components/rejected-changes/rejected-change-edit-screen";
import type { RejectedChange } from "@/lib/sync/outbox";

const mockGetRejectedChange = jest.fn();
const mockResubmit = jest.fn();
const mockUseAccess = jest.requireMock("@/modules/access").useAccess as jest.Mock;

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ commandId: "cmd-1" }),
}));

jest.mock("@/db/client", () => ({
  useDatabase: () => "database",
}));

jest.mock("@/lib/sync/outbox", () => ({
  getRejectedChange: (...args: unknown[]) => mockGetRejectedChange(...args),
}));

jest.mock("@/hooks/use-rejected-changes", () => ({
  useRejectedChanges: () => ({
    changes: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    discard: jest.fn(),
    resubmit: mockResubmit,
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

describe("RejectedChangeEditScreen", () => {
  beforeEach(() => {
    mockGetRejectedChange.mockReset();
    mockResubmit.mockReset();
    mockUseAccess.mockReturnValue({
      kind: "signed_in",
      user: { userId: "user-1", email: "ada@trove.ing", displayName: "Ada" },
      household: { kind: "none" },
      memberships: [],
      setActiveHousehold: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it("pre-populates the form with the original payload values and shows the reason", async () => {
    mockGetRejectedChange.mockResolvedValue(makeChange());

    await render(<RejectedChangeEditScreen commandId="cmd-1" />);

    expect(await screen.findByDisplayValue("-50")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Coffee")).toBeOnTheScreen();
    expect(screen.getByText(/amountMinor: must be positive/)).toBeOnTheScreen();
  });

  it("saves edited values as a NEW command and navigates back", async () => {
    mockGetRejectedChange.mockResolvedValue(makeChange());
    mockResubmit.mockResolvedValue("cmd-new-uuid");

    const { getByDisplayValue } = await render(<RejectedChangeEditScreen commandId="cmd-1" />);

    const amountInput = await waitFor(() => getByDisplayValue("-50"));
    // RNTL v14: fireEvent is async — each interaction must be awaited so its
    // state updates flush inside act before the next step.
    await fireEvent.changeText(amountInput, "450");
    await fireEvent.press(screen.getByText("📨 Resubmit"));

    await waitFor(() => {
      expect(mockResubmit).toHaveBeenCalledWith("cmd-1", {
        amountMinor: 450,
        description: "Coffee",
      });
      expect(router.back).toHaveBeenCalled();
    });
  });

  it("keeps the user on the form when the resubmit fails", async () => {
    mockGetRejectedChange.mockResolvedValue(makeChange());
    mockResubmit.mockRejectedValue(new Error("disk full"));

    await render(<RejectedChangeEditScreen commandId="cmd-1" />);

    await fireEvent.press(await screen.findByText("📨 Resubmit"));

    expect(await screen.findByText(/still in your inbox/)).toBeOnTheScreen();
    expect(router.back).not.toHaveBeenCalled();
  });

  it("explains when the rejected change is already gone", async () => {
    mockGetRejectedChange.mockResolvedValue(null);

    await render(<RejectedChangeEditScreen commandId="cmd-1" />);

    expect(await screen.findByText("Nothing to edit")).toBeOnTheScreen();
  });
});
