// oxlint-disable anti-slop/no-module-mocking -- router and ledger query boundaries
import { fireEvent, render, screen } from "@testing-library/react-native";

import { CreateTabButton } from "./create-tab-button";

const mockPush = jest.fn();
const mockUseAccounts = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccounts: () => mockUseAccounts(),
}));

describe("CreateTabButton", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUseAccounts.mockReset();
  });

  it("opens account creation when no accounts exist", async () => {
    mockUseAccounts.mockReturnValue({ data: [], isLoading: false });

    await render(<CreateTabButton />);

    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    expect(mockPush).toHaveBeenCalledWith("/accounts");
  });

  it("opens transaction creation when an account exists", async () => {
    mockUseAccounts.mockReturnValue({ data: [{ id: "account-1" }], isLoading: false });

    await render(<CreateTabButton />);

    await fireEvent.press(screen.getByRole("button", { name: "Create transaction" }));

    expect(mockPush).toHaveBeenCalledWith("/transaction/new");
  });

  it("disables creation while accounts are loading", async () => {
    mockUseAccounts.mockReturnValue({ data: [], isLoading: true });

    await render(<CreateTabButton />);

    const button = screen.getByRole("button", { name: "Loading accounts" });
    expect(button).toBeDisabled();
    await fireEvent.press(button);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
