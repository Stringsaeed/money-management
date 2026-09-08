import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccountArchiveBlockerItem } from "@/components/account/account-archive-blocker-item";
import { useUIStore } from "@/stores/ui-store";
import { createAccountWithBalance } from "@/tests/test-utils/factories";

describe("AccountArchiveBlockerItem", () => {
  beforeEach(() => {
    useUIStore.getState().resetFilters();
  });

  it("routes Review Balance through the onReview callback with the Ledger destination", async () => {
    const onReview = jest.fn();
    const account = createAccountWithBalance({ id: "account-1", name: "Everyday" });

    await render(
      <AccountArchiveBlockerItem
        account={account}
        blocker={{
          kind: "non-zero-balance",
          balanceMinor: 25_00,
          recoveryAction: "Record transactions or transfers until this Account balance is zero.",
        }}
        onReview={onReview}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Review Everyday balance" }));

    expect(onReview).toHaveBeenCalledWith("/(tabs)/ledger");
  });

  it("sets the active account filter so the Ledger surfaces the relevant balance", async () => {
    const onReview = jest.fn();
    const account = createAccountWithBalance({ id: "account-1", name: "Everyday" });

    await render(
      <AccountArchiveBlockerItem
        account={account}
        blocker={{
          kind: "non-zero-balance",
          balanceMinor: 25_00,
          recoveryAction: "Record transactions or transfers until this Account balance is zero.",
        }}
        onReview={onReview}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Review Everyday balance" }));

    expect(useUIStore.getState().activeAccountId).toBe("account-1");
  });

  it("routes Review Recurring Rules through the onReview callback with the Recurring destination", async () => {
    const onReview = jest.fn();
    const account = createAccountWithBalance({ id: "account-1", name: "Everyday" });

    await render(
      <AccountArchiveBlockerItem
        account={account}
        blocker={{
          kind: "active-recurring-rules",
          rules: [{ ruleId: "rule-1", name: "Rent", relationship: "source" }],
          recoveryAction: "Pause or archive every listed Recurring Rule.",
        }}
        onReview={onReview}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Review blocking Recurring Rules" }));

    expect(onReview).toHaveBeenCalledWith("/recurring");
  });

  it("routes Review Budget through the onReview callback with the Envelopes destination", async () => {
    const onReview = jest.fn();
    const account = createAccountWithBalance({ id: "account-1", name: "Everyday" });

    await render(
      <AccountArchiveBlockerItem
        account={account}
        blocker={{
          kind: "budget-dependencies",
          dependencies: [
            {
              kind: "budget-shortfall",
              currency: "USD",
              amountMinor: 25_00,
              recoveryAction: "Increase the Funding Pool.",
            },
          ],
          recoveryAction: "Resolve every listed budget dependency before archiving this Account.",
        }}
        onReview={onReview}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Review blocking budget dependencies" }));

    expect(onReview).toHaveBeenCalledWith("/(tabs)/envelopes");
  });
});
