import { fireEvent, render, screen } from "@testing-library/react-native";

import { SignInStep } from "@/components/auth/sign-in-step";
import type { JourneyState } from "@/modules/auth-journey";

const mockSend = jest.fn();

const identify: Extract<JourneyState, { step: "identify" }> = {
  step: "identify",
  email: "",
  busy: false,
  notice: null,
};

const password: Extract<JourneyState, { step: "password" }> = {
  step: "password",
  email: "ada@trove.ing",
  busy: false,
  notice: null,
};

describe("SignInStep", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("projects identify with every path permanently visible", async () => {
    await render(<SignInStep journey={{ state: identify, send: mockSend }} />);

    expect(screen.getByText("Send Email Link ✨")).toBeOnTheScreen();
    expect(screen.getByText("Use password instead")).toBeOnTheScreen();
    expect(screen.getByText("Create profile with password")).toBeOnTheScreen();
    expect(screen.getByText("Forgot password?")).toBeOnTheScreen();
  });

  it("sends create-profile from identify", async () => {
    await render(<SignInStep journey={{ state: identify, send: mockSend }} />);
    await fireEvent.press(screen.getByText("Create profile with password"));
    expect(mockSend).toHaveBeenCalledWith({ type: "chose_create_profile" });
  });

  it("opens password recovery from password sign-in", async () => {
    await render(<SignInStep journey={{ state: password, send: mockSend }} />);
    await fireEvent.press(screen.getByText("Forgot password?"));
    expect(mockSend).toHaveBeenCalledWith({ type: "chose_recovery" });
  });
});
