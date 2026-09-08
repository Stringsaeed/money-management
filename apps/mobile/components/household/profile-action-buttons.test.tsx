// oxlint-disable anti-slop/no-module-mocking -- Jest owns the hook/network boundary for UI action tests.
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { CreateHouseholdForm } from "./create-household-form";
import { JoinHouseholdForm } from "./join-household-form";
import { EnableSyncCard } from "./enable-sync-card";
import { HouseholdMembers } from "./household-members";
import { ActiveHouseholdPanel } from "./active-household-panel";

const mockCreateMutateAsync = jest.fn();
const mockAcceptMutateAsync = jest.fn();
const mockEnableSync = jest.fn();
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
    status: "idle",
    error: null,
    discrepancy: null,
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
  });

  it("starts sync for an active household", async () => {
    await render(<EnableSyncCard activeHouseholdId="hh-1" />);
    await fireEvent.press(screen.getByText("Enable Sync"));
    expect(mockEnableSync).toHaveBeenCalledWith({ householdId: "hh-1" });
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
