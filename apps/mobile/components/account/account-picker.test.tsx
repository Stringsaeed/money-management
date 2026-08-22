import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccountPicker } from "@/components/account/account-picker";
import { createAccount } from "@/tests/test-utils/factories";

const mockUseAccounts = jest.fn();

jest.mock("@/hooks/use-accounts", () => ({
  useAccounts: () => mockUseAccounts(),
}));

describe("AccountPicker", () => {
  beforeEach(() => {
    mockUseAccounts.mockReturnValue({
      data: [
        createAccount({ id: "account-1", name: "Checking", currency: "USD" }),
        createAccount({ id: "account-2", name: "Savings", currency: "EUR" }),
      ],
    });
  });

  it("renders a label, filters excluded accounts, and reports presses", async () => {
    const onChange = jest.fn();

    await render(
      <AccountPicker value={null} onChange={onChange} label="Account" exclude={["account-1"]} />,
    );

    expect(screen.getByText("Account")).toBeOnTheScreen();
    expect(screen.queryByText("Checking")).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Savings"));

    expect(onChange).toHaveBeenCalledWith("account-2");
  });
});
