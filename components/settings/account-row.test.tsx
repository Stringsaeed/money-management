import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccountRow } from "@/components/settings/account-row";
import { createAccountWithBalance } from "@/tests/test-utils/factories";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

describe("AccountRow", () => {
  it("renders account details and routes to the account screen", () => {
    render(<AccountRow account={createAccountWithBalance({ id: "account-1", name: "Wallet" })} />);

    fireEvent.press(screen.getByText("Wallet"));

    expect(screen.getByText(/Checking/)).toBeOnTheScreen();
    expect(screen.getByText("$250.00")).toBeOnTheScreen();
    expect(mockPush).toHaveBeenCalledWith("/account/account-1");
  });
});
