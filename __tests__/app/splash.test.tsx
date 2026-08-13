import { render, screen } from "@testing-library/react-native";

import Splash from "@/app/splash";

const mockUseAccountsWithBalances = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `redirect:${href}`);
  },
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => mockUseAccountsWithBalances(),
}));

describe("app/splash", () => {
  it("redirects to onboarding when there are no accounts", async () => {
    mockUseAccountsWithBalances.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await render(<Splash />);

    expect(screen.getByText("redirect:/onboarding")).toBeOnTheScreen();
  });

  it("redirects home when accounts exist", async () => {
    mockUseAccountsWithBalances.mockReturnValue({
      data: [{ id: "account-1" }],
      isLoading: false,
    });

    await render(<Splash />);

    expect(screen.getByText("redirect:/")).toBeOnTheScreen();
  });
});
