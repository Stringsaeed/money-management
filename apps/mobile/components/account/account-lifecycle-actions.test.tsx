import { render, screen } from "@testing-library/react-native";

import { AccountLifecycleActions } from "@/components/account/account-lifecycle-actions";
import { createAccountWithBalance } from "@/tests/test-utils/factories";

const mockArchivalPreview = jest.fn();
const mockDeletionPreview = jest.fn();

jest.mock("@/components/account/account-archive-blockers", () => ({
  AccountArchiveBlockers: () => null,
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccountArchivalPreview: () => mockArchivalPreview(),
  useAccountDeletionPreview: () => mockDeletionPreview(),
  useArchiveAccount: () => ({ mutateAsync: jest.fn() }),
  useDeleteAccount: () => ({ mutateAsync: jest.fn() }),
  useRestoreAccount: () => ({ mutateAsync: jest.fn() }),
}));

describe("AccountLifecycleActions", () => {
  it("enables Archive on synced without Delete", async () => {
    mockArchivalPreview.mockReturnValue({
      data: undefined,
      isError: false,
      source: "synced",
    });
    mockDeletionPreview.mockReturnValue({
      data: undefined,
      isError: false,
      isSuccess: false,
      source: "synced",
    });

    await render(
      <AccountLifecycleActions
        account={createAccountWithBalance({ name: "Everyday" })}
        onCompleted={jest.fn()}
        onReview={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Archive Everyday" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Restore Everyday" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Permanently delete Everyday" })).toBeNull();
  });

  it("hides Restore on a synced archived Account", async () => {
    mockArchivalPreview.mockReturnValue({
      data: undefined,
      isError: false,
      source: "synced",
    });
    mockDeletionPreview.mockReturnValue({
      data: undefined,
      isError: false,
      isSuccess: false,
      source: "synced",
    });

    await render(
      <AccountLifecycleActions
        account={createAccountWithBalance({ name: "Everyday", lifecycle: "archived" })}
        onCompleted={jest.fn()}
        onReview={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Restore Everyday" })).toBeNull();
    expect(screen.getByText(/keep their history/)).toBeOnTheScreen();
  });

  it("keeps local Archive gated on the preview and still offers Delete", async () => {
    mockArchivalPreview.mockReturnValue({
      data: { canArchive: true, blockers: [] },
      isError: false,
      source: "local",
    });
    mockDeletionPreview.mockReturnValue({
      data: { canDelete: true },
      isError: false,
      isSuccess: true,
      source: "local",
    });

    await render(
      <AccountLifecycleActions
        account={createAccountWithBalance({ name: "Wallet" })}
        onCompleted={jest.fn()}
        onReview={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Archive Wallet" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Permanently delete Wallet" })).toBeOnTheScreen();
  });
});
