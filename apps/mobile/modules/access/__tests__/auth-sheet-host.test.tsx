// oxlint-disable anti-slop/no-module-mocking -- Jest owns AuthBottomSheet, access, and expo-router boundaries.
import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";

import { AuthSheetHost } from "../auth-sheet-host";
import { AUTH_SHEET_CLOSED, type AuthSheetSession } from "../auth-sheet-session";

function mockAuthBottomSheet({
  children,
  isPresented,
}: {
  children: ReactNode;
  isPresented?: boolean;
}) {
  return isPresented ? <Text testID="auth-sheet-mounted">{children}</Text> : null;
}

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

jest.mock("@/components/auth/auth-bottom-sheet", () => ({
  AuthBottomSheet: (props: { children: ReactNode; isPresented?: boolean }) =>
    mockAuthBottomSheet(props),
}));

jest.mock("@/modules/access/use-access", () => ({
  useAccess: () => ({ kind: "anonymous" }),
}));

jest.mock("@/modules/access/actions", () => ({
  beginHostedSignIn: jest.fn(),
}));

const openSession: AuthSheetSession = {
  kind: "open",
  target: { kind: "profile_household" },
};

describe("AuthSheetHost", () => {
  it("unmounts the auth sheet when the session is closed", async () => {
    await render(<AuthSheetHost session={AUTH_SHEET_CLOSED} onDismiss={() => undefined} />);

    expect(screen.queryByTestId("auth-sheet-mounted")).toBeNull();
  });

  it("mounts the auth sheet only while the session is open", async () => {
    await render(<AuthSheetHost session={openSession} onDismiss={() => undefined} />);

    expect(screen.getByTestId("auth-sheet-mounted")).toBeOnTheScreen();
    expect(screen.getByText("Sign in with email code")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Continue with email code" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();
  });
});
