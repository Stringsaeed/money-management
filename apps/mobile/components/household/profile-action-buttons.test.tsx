// oxlint-disable anti-slop/no-module-mocking -- Jest owns the hook/network boundary for UI action tests.
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import type { EnableSyncStatus } from "@/hooks/use-enable-sync";

import { CreateHouseholdForm } from "./create-household-form";
import { JoinHouseholdForm } from "./join-household-form";
import { EnableSyncCard } from "./enable-sync-card";
import { HouseholdMembers } from "./household-members";
import { ActiveHouseholdPanel } from "./active-household-panel";

const mockCreateMutateAsync = jest.fn();
const mockAcceptMutateAsync = jest.fn();
const mockEnableSync = jest.fn();
type EnableSyncMockState = {
  status: EnableSyncStatus;
  error: Error | null;
  discrepancy: { localManifest: object; serverManifest: object } | null;
};
const mockEnableSyncState: EnableSyncMockState = {
  status: "idle",
  error: null,
  discrepancy: null,
};
const mockTransferMutate = jest.fn();
const mockGenerateInviteMutate = jest.fn();
const mockLeaveMutate = jest.fn();
const mockDeleteMutate = jest.fn();

jest.mock("@/hooks/use-households", () => ({
  useCreateHousehold: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
    isError: false,
  }),
  useAcceptInvite: () => ({
    mutateAsync: mockAcceptMutateAsync,
    isPending: false,
    isError: false,
  }),
  useTransferOwnership: () => ({
    mutate: mockTransferMutate,
    isPending: false,
    isError: false,
  }),
  useGenerateInvite: () => ({ mutate: mockGenerateInviteMutate }),
  useLeaveHousehold: () => ({ mutate: mockLeaveMutate }),
  useDeleteHousehold: () => ({ mutate: mockDeleteMutate }),
}));

jest.mock("@/hooks/use-enable-sync", () => ({
  useEnableSync: () => ({
    status: mockEnableSyncState.status,
    error: mockEnableSyncState.error,
    discrepancy: mockEnableSyncState.discrepancy,
    enableSync: mockEnableSync,
  }),
}));

describe("CreateHouseholdForm", () => {
  beforeEach(() => {
    mockCreateMutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it("creates a household from the primary button", async () => {
    await render(<CreateHouseholdForm />);
    await fireEvent.changeText(
      screen.getByPlaceholderText("Household name (e.g. The Saeeds)"),
      "The Saeeds",
    );
    await fireEvent.press(screen.getByText("🏠 Create household"));
    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith("The Saeeds");
    });
  });

  it("keeps the create control disabled without a name", async () => {
    await render(<CreateHouseholdForm />);
    expect(screen.getByTestId("create-household")).toBeDisabled();
  });
});

describe("JoinHouseholdForm", () => {
  beforeEach(() => {
    mockAcceptMutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it("joins with a valid invite code", async () => {
    await render(<JoinHouseholdForm />);
    await fireEvent.changeText(
      screen.getByPlaceholderText("Invite code (e.g. ABCD2345)"),
      "ABCD2345",
    );
    await fireEvent.press(screen.getByText("🤝 Join household"));
    await waitFor(() => {
      expect(mockAcceptMutateAsync).toHaveBeenCalledWith("ABCD2345");
    });
  });
});

describe("EnableSyncCard", () => {
  beforeEach(() => {
    mockEnableSync.mockReset().mockResolvedValue(undefined);
    mockEnableSyncState.status = "idle";
    mockEnableSyncState.error = null;
    mockEnableSyncState.discrepancy = null;
  });

  it("starts sync for an active household", async () => {
    await render(<EnableSyncCard activeHouseholdId="hh-1" />);
    await fireEvent.press(screen.getByTestId("enable-sync"));
    expect(mockEnableSync).toHaveBeenCalledWith({ householdId: "hh-1" });
  });

  it("shows the concise idle description instead of sharing filler", async () => {
    await render(<EnableSyncCard activeHouseholdId="hh-1" />);
    expect(
      screen.getByText("Back up your data and keep it in sync across devices."),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Move your existing accounts/)).toBeNull();
    expect(screen.queryByText(/ready to share/i)).toBeNull();
  });

  it("announces a concise mismatch as an alert", async () => {
    mockEnableSyncState.status = "mismatched";
    mockEnableSyncState.discrepancy = { localManifest: {}, serverManifest: {} };
    await render(<EnableSyncCard activeHouseholdId="hh-1" />);
    expect(
      screen.getByText("The upload didn't reconcile — your local data is unchanged. Try again."),
    ).toBeOnTheScreen();
    expect(screen.getByRole("alert")).toBeOnTheScreen();
    expect(screen.getByText("Try again")).toBeOnTheScreen();
    expect(screen.queryByText(/pre-import backup/)).toBeNull();
  });

  it("shows the concise matched description, not household sharing", async () => {
    mockEnableSyncState.status = "matched";
    await render(<EnableSyncCard activeHouseholdId="hh-1" />);
    expect(screen.getByText("Your data stays synced across devices.")).toBeOnTheScreen();
    expect(screen.queryByText(/shared with your household/)).toBeNull();
    expect(screen.queryByText("Enable Sync")).toBeNull();
  });
});

describe("HouseholdMembers", () => {
  it("confirms ownership transfer from Make owner", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const transfer = buttons?.find((button) => button.text === "Transfer");
      transfer?.onPress?.();
    });

    await render(
      <HouseholdMembers
        householdId="hh-1"
        currentUserId="owner-1"
        isOwner
        members={[
          {
            userId: "owner-1",
            userName: "Ada",
            userEmail: "ada@trove.ing",
            role: "owner",
          },
          {
            userId: "member-2",
            userName: "Grace",
            userEmail: "grace@trove.ing",
            role: "member",
          },
        ]}
      />,
    );

    await fireEvent.press(screen.getByText("Make owner"));
    expect(mockTransferMutate).toHaveBeenCalledWith({
      householdId: "hh-1",
      userId: "member-2",
    });
    alertSpy.mockRestore();
  });
});

describe("ActiveHouseholdPanel", () => {
  it("renders invite and leave actions for members", async () => {
    await render(
      <ActiveHouseholdPanel
        householdId="hh-1"
        name="The Saeeds"
        currentUserId="member-1"
        isOwner={false}
        needsSync={false}
        members={[]}
      />,
    );

    expect(screen.getByText("Invite 🎟️")).toBeOnTheScreen();
    expect(screen.getByText("Leave household")).toBeOnTheScreen();
  });

  it("renders delete for owners", async () => {
    await render(
      <ActiveHouseholdPanel
        householdId="hh-1"
        name="The Saeeds"
        currentUserId="owner-1"
        isOwner
        needsSync={false}
        members={[]}
      />,
    );

    expect(screen.getByText("Delete household")).toBeOnTheScreen();
  });
});
