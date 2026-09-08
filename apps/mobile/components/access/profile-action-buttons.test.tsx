import { fireEvent, render, screen } from "@testing-library/react-native";

import { SignedOutCard } from "./signed-out-card";
import { SessionRevokedCard } from "./session-revoked-card";

describe("SignedOutCard", () => {
  it("invokes onSignIn from the primary CTA", async () => {
    const onSignIn = jest.fn();
    await render(<SignedOutCard onSignIn={onSignIn} />);

    await fireEvent.press(screen.getByText("Sign in or create profile"));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("exposes a stable test id for the sign-in control", async () => {
    await render(<SignedOutCard onSignIn={jest.fn()} />);
    expect(screen.getByTestId("profile-sign-in")).toBeOnTheScreen();
  });
});

describe("SessionRevokedCard", () => {
  it("wires reauthenticate and sign-out actions", async () => {
    const onReauthenticate = jest.fn();
    const onSignOut = jest.fn();
    await render(
      <SessionRevokedCard
        email="ada@trove.ing"
        onReauthenticate={onReauthenticate}
        onSignOut={onSignOut}
      />,
    );

    await fireEvent.press(screen.getByText("Sign in again"));
    await fireEvent.press(screen.getByText("Forget this profile"));
    expect(onReauthenticate).toHaveBeenCalledTimes(1);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
