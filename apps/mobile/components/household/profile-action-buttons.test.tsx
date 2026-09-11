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
const mockOpenWidgetMutate = jest.fn();
const mockLeaveMutate = jest.fn();
const mockDeleteMutate = jest.fn();

jest.mock("@/hooks/use-households", () => ({
  useCreateHousehold: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
    isError: false,
  }),
  useOpenMemberWidget: () => ({
    mutate: mockOpenWidgetMutate,
    isPending: false,
    isError: false,
  }),
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
  it("explains WorkOS invitation email instead of invite codes", async () => {
    await render(<JoinHouseholdForm />);
    expect(screen.getByText(/invitation link/i)).toBeOnTheScreen();
    expect(screen.queryByPlaceholderText(/Invite code/i)).toBeNull();
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
  it("renders WorkOS roles without ownership transfer", async () => {
    await render(
      <HouseholdMembers
        currentUserId="admin-1"
        members={[
          {
            userId: "admin-1",
            userName: "Ada",
            userEmail: "ada@trove.ing",
            role: "admin",
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

    expect(screen.getByText(/Admin/)).toBeOnTheScreen();
    expect(screen.getByText("Member")).toBeOnTheScreen();
    expect(screen.queryByText("Make owner")).toBeNull();
  });
});

describe("ActiveHouseholdPanel", () => {
  beforeEach(() => {
    mockOpenWidgetMutate.mockReset();
    mockLeaveMutate.mockReset();
    mockDeleteMutate.mockReset();
  });

  it("renders manage and leave actions for admins", async () => {
    await render(
      <ActiveHouseholdPanel
        householdId="hh-1"
        name="The Saeeds"
        currentUserId="admin-1"
        isAdmin
        needsSync={false}
        members={[]}
      />,
    );

    expect(screen.getByText("Manage 👥")).toBeOnTheScreen();
    expect(screen.getByText("Delete household")).toBeOnTheScreen();
    expect(screen.getByText("Leave household")).toBeOnTheScreen();
  });

  it("hides manage for non-admins and shows leave", async () => {
    await render(
      <ActiveHouseholdPanel
        householdId="hh-1"
        name="The Saeeds"
        currentUserId="member-1"
        isAdmin={false}
        needsSync={false}
        members={[]}
      />,
    );

    expect(screen.queryByText("Manage 👥")).toBeNull();
    expect(screen.getByText("Leave household")).toBeOnTheScreen();
    expect(screen.queryByText("Delete household")).toBeNull();
  });

  it("opens the member widget for admins", async () => {
    await render(
      <ActiveHouseholdPanel
        householdId="hh-1"
        name="The Saeeds"
        currentUserId="admin-1"
        isAdmin
        needsSync={false}
        members={[]}
      />,
    );
    await fireEvent.press(screen.getByTestId("manage-household-members"));
    expect(mockOpenWidgetMutate).toHaveBeenCalledWith("hh-1", expect.any(Object));
  });

  it("confirms delete for admins", async () => {
    const promptSpy = jest
      .spyOn(Alert, "prompt")
      .mockImplementation((_title, _message, buttons) => {
        if (!Array.isArray(buttons)) {
          return;
        }
        const del = buttons.find((button) => button.text === "Delete");
        const onPress = del?.onPress as ((value?: string) => void) | undefined;
        onPress?.("The Saeeds");
      });
    await render(
      <ActiveHouseholdPanel
        householdId="hh-1"
        name="The Saeeds"
        currentUserId="admin-1"
        isAdmin
        needsSync={false}
        members={[]}
      />,
    );
    await fireEvent.press(screen.getByTestId("delete-household"));
    expect(mockDeleteMutate).toHaveBeenCalledWith({
      householdId: "hh-1",
      confirmName: "The Saeeds",
    });
    promptSpy.mockRestore();
  });
});
