import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AccountsScreen from "@/app/accounts";
import { createAccountWithBalance } from "@/tests/test-utils/factories";

const mockBlockedAccount = createAccountWithBalance({
  id: "account-blocked",
  name: "Everyday",
  balance: 25_00,
});
const mockUnusedAccount = createAccountWithBalance({
  id: "account-unused",
  name: "Unused",
  initialBalance: 0,
  balance: 0,
});
const mockArchivedAccount = createAccountWithBalance({
  id: "account-archived",
  name: "Old Wallet",
  initialBalance: 0,
  balance: 0,
  lifecycle: "archived",
});

const mockArchiveAccount = jest.fn();
const mockCreateAccount = jest.fn();
const mockDeleteAccount = jest.fn();
const mockRestoreAccount = jest.fn();
const mockUpdateAccount = jest.fn();
const mockPush = jest.fn();
let mockArchivedLifecycle: "active" | "archived" = "archived";

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAllAccountsWithBalances: () => ({
    data: [
      mockBlockedAccount,
      mockUnusedAccount,
      { ...mockArchivedAccount, lifecycle: mockArchivedLifecycle },
    ],
  }),
  useAccountArchivalPreview: (id: string) => ({
    data:
      id === "account-blocked"
        ? {
            accountId: id,
            canArchive: false,
            blockers: [
              {
                kind: "non-zero-balance",
                balanceMinor: 25_00,
                recoveryAction:
                  "Record transactions or transfers until this Account balance is zero.",
              },
              {
                kind: "active-recurring-rules",
                rules: [
                  { ruleId: "rule-rent", name: "Rent", relationship: "source" },
                  {
                    ruleId: "rule-sweep",
                    name: "Savings sweep",
                    relationship: "destination",
                  },
                ],
                recoveryAction: "Pause, archive, or repair every listed Recurring Rule.",
              },
            ],
          }
        : { accountId: id, canArchive: true, blockers: [] },
    isError: false,
  }),
  useAccountDeletionPreview: (id: string) => ({
    data: { accountId: id, canDelete: id === "account-unused" },
    isError: false,
    isSuccess: true,
  }),
  useArchiveAccount: () => ({ mutateAsync: mockArchiveAccount }),
  useCreateAccount: () => ({ mutateAsync: mockCreateAccount }),
  useDeleteAccount: () => ({ mutateAsync: mockDeleteAccount }),
  useRestoreAccount: () => ({ mutateAsync: mockRestoreAccount }),
  useUpdateAccount: () => ({ mutateAsync: mockUpdateAccount }),
}));

describe("app/accounts", () => {
  beforeEach(() => {
    mockArchivedLifecycle = "archived";
    mockArchiveAccount.mockResolvedValue(undefined);
    mockCreateAccount.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(undefined);
    mockRestoreAccount.mockImplementation(async () => {
      mockArchivedLifecycle = "active";
    });
    mockUpdateAccount.mockResolvedValue(undefined);
  });

  it("shows every blocked prerequisite and direct recovery action without a swipe bypass", async () => {
    await render(
      <GestureHandlerRootView>
        <AccountsScreen />
      </GestureHandlerRootView>,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Everyday" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Resolve every prerequisite before archiving",
    );
    expect(screen.getByText(/Current balance:/)).toBeOnTheScreen();
    expect(screen.getByText(/Active Recurring Rules: Rent, Savings sweep/)).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Review Everyday balance" })).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Review blocking Recurring Rules" }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Archive Everyday" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Delete Everyday" })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Review blocking Recurring Rules" }));
    expect(mockPush).toHaveBeenCalledWith("/recurring");
  });

  it("labels archived Accounts and restores without promising Funding Membership", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const view = await render(
      <GestureHandlerRootView>
        <AccountsScreen />
      </GestureHandlerRootView>,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Old Wallet, Archived" }));

    expect(screen.getByRole("button", { name: "Restore Old Wallet" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Archive Old Wallet" })).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Restore Old Wallet" }));
    expect(alert.mock.calls[0]?.[1]).toContain("Funding Membership stays off");
    const restoreAction = alert.mock.calls[0]?.[2]?.find((button) => button.text === "Restore");
    await act(async () => {
      await restoreAction?.onPress?.();
    });

    expect(mockRestoreAccount).toHaveBeenCalledWith("account-archived");
    await view.rerender(
      <GestureHandlerRootView>
        <AccountsScreen />
      </GestureHandlerRootView>,
    );
    expect(screen.getByRole("button", { name: "Old Wallet" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Old Wallet, Archived" })).not.toBeOnTheScreen();
  });

  it("offers permanent Delete only for an unused Account", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await render(
      <GestureHandlerRootView>
        <AccountsScreen />
      </GestureHandlerRootView>,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Unused" }));
    await fireEvent.press(screen.getByRole("button", { name: "Permanently delete Unused" }));
    const deleteAction = alert.mock.calls[0]?.[2]?.find(
      (button) => button.text === "Delete Permanently",
    );
    await act(async () => {
      await deleteAction?.onPress?.();
    });

    expect(mockDeleteAccount).toHaveBeenCalledWith("account-unused");
  });
});
