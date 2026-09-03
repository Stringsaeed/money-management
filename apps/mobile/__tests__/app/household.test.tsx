import { render, screen } from "@testing-library/react-native";

import HouseholdScreen from "@/app/(tabs)/settings/household";

const mockUseAccess = jest.requireMock("@/modules/access").useAccess as jest.Mock;

jest.mock("@/components/household/signed-in-household", () => ({
  SignedInHousehold: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, "signed-in-household");
  },
}));

describe("settings/household", () => {
  beforeEach(() => {
    mockUseAccess.mockReset();
  });

  it("renders the anonymous sign-in card", async () => {
    mockUseAccess.mockReturnValue({ kind: "anonymous", beginAuth: jest.fn() });
    await render(<HouseholdScreen />);
    expect(screen.getByText("Sign in or create profile")).toBeOnTheScreen();
  });

  it("renders a distinct revoked state", async () => {
    mockUseAccess.mockReturnValue({
      kind: "session_revoked",
      lastKnown: { userId: "u1", email: "ada@trove.ing", displayName: "Ada" },
      reauthenticate: jest.fn(),
      signOut: jest.fn(),
    });
    await render(<HouseholdScreen />);
    expect(screen.getByText("Signed out remotely")).toBeOnTheScreen();
    expect(screen.getByText("Sign in again")).toBeOnTheScreen();
  });

  it("renders the signed-in household", async () => {
    mockUseAccess.mockReturnValue({
      kind: "signed_in",
      user: { userId: "u1", email: "ada@trove.ing", displayName: "Ada" },
      household: { kind: "none" },
      memberships: [],
      setActiveHousehold: jest.fn(),
      signOut: jest.fn(),
    });
    await render(<HouseholdScreen />);
    expect(screen.getByText("signed-in-household")).toBeOnTheScreen();
  });
});
