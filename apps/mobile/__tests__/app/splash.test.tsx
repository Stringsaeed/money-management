import { render, screen } from "@testing-library/react-native";

import Splash from "@/app/splash";

const mockUseAllAccountsWithBalances = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `redirect:${href}`);
  },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAllAccountsWithBalances: () => mockUseAllAccountsWithBalances(),
}));

describe("app/splash", () => {
  it("redirects to onboarding when there are no accounts", async () => {
    mockUseAllAccountsWithBalances.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await render(<Splash />);

    expect(screen.getByText("redirect:/onboarding")).toBeOnTheScreen();
  });

  it("redirects home when only archived Accounts exist", async () => {
    mockUseAllAccountsWithBalances.mockReturnValue({
      data: [{ id: "account-1", lifecycle: "archived" }],
      isLoading: false,
    });

    await render(<Splash />);

    expect(screen.getByText("redirect:/")).toBeOnTheScreen();
  });
});
