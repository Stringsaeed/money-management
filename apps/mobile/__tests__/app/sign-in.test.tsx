import { fireEvent, render, screen } from "@testing-library/react-native";

import SignInScreen from "@/app/(auth)/sign-in";
import type { JourneyState } from "@/modules/auth-journey";

const mockSend = jest.fn();
const mockUseAuthJourney = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
}));

jest.mock("@/modules/auth-journey", () => ({
  useAuthJourney: (...args: unknown[]) => mockUseAuthJourney(...args),
}));

const identify: Extract<JourneyState, { step: "identify" }> = {
  step: "identify",
  email: "",
  busy: false,
  notice: null,
};

describe("app/(auth)/sign-in", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockUseAuthJourney.mockReturnValue({ state: identify, send: mockSend });
  });

  it("projects identify with every path permanently visible", async () => {
    await render(<SignInScreen />);

    expect(screen.getByText("Send Email Link ✨")).toBeOnTheScreen();
    expect(screen.getByText("Use password instead")).toBeOnTheScreen();
    expect(screen.getByText("Create profile with password")).toBeOnTheScreen();
    expect(screen.getByText("Forgot password?")).toBeOnTheScreen();
  });

  it("sends create-profile from identify", async () => {
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByText("Create profile with password"));
    expect(mockSend).toHaveBeenCalledWith({ type: "chose_create_profile" });
  });
});
