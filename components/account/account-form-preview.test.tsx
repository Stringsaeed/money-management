import { render, screen } from "@testing-library/react-native";

import { AccountFormPreview } from "@/components/account/account-form-preview";
import { AccountTypeColors } from "@/constants/theme";

describe("AccountFormPreview", () => {
  it("shows placeholder name and zero balance when fields are empty", () => {
    render(
      <AccountFormPreview
        values={{
          amount: "",
          color: AccountTypeColors.checking,
          currency: "USD",
          name: "",
          type: "checking",
        }}
      />,
    );

    expect(screen.getByText("New account")).toBeOnTheScreen();
    expect(screen.getByText("$0.00")).toBeOnTheScreen();
    expect(screen.getByText(/Checking · USD/)).toBeOnTheScreen();
  });

  it("shows trimmed name and formatted balance", () => {
    render(
      <AccountFormPreview
        values={{
          amount: "250.50",
          color: AccountTypeColors.savings,
          currency: "EUR",
          name: "  Vacation  ",
          type: "savings",
        }}
      />,
    );

    expect(screen.getByText("Vacation")).toBeOnTheScreen();
    expect(screen.getByText(/Savings · EUR/)).toBeOnTheScreen();
    expect(screen.getByText(/250\.50/)).toBeOnTheScreen();
  });
});
