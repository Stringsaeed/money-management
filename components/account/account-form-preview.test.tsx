import { render, screen } from "@testing-library/react-native";

import { AccountFormPreview } from "@/components/account/account-form-preview";
import { AccountTypeColors } from "@/constants/theme";

describe("AccountFormPreview", () => {
  it("shows placeholder name and zero balance when fields are empty", async () => {
    await render(
      <AccountFormPreview
        values={{
          amount: "",
          color: AccountTypeColors.checking,
          currency: "USD",
          icon: "💳",
          name: "",
          type: "checking",
        }}
      />,
    );

    expect(screen.getByText("New account")).toBeOnTheScreen();
    expect(screen.getByText("$0.00")).toBeOnTheScreen();
    expect(screen.getByText(/Checking · USD/)).toBeOnTheScreen();
  });

  it("shows trimmed name and formatted balance", async () => {
    await render(
      <AccountFormPreview
        values={{
          amount: "250.50",
          color: AccountTypeColors.savings,
          currency: "EUR",
          icon: "🏦",
          name: "  Vacation  ",
          type: "savings",
        }}
      />,
    );

    expect(screen.getByText("Vacation")).toBeOnTheScreen();
    expect(screen.getByText(/Savings · EUR/)).toBeOnTheScreen();
    expect(screen.getByText(/250\.50/)).toBeOnTheScreen();
  });

  it("shows the locked balance instead of the amount field", async () => {
    await render(
      <AccountFormPreview
        lockedBalanceCents={180_00}
        values={{
          amount: "12.00",
          color: AccountTypeColors.checking,
          currency: "USD",
          icon: "💎",
          name: "Wallet",
          type: "checking",
        }}
      />,
    );

    expect(screen.getByText("$180.00")).toBeOnTheScreen();
    expect(screen.queryByText("$12.00")).not.toBeOnTheScreen();
    expect(screen.getByText("💎")).toBeOnTheScreen();
  });
});
