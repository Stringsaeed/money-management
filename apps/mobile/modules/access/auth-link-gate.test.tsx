// oxlint-disable anti-slop/no-module-mocking -- required native and access boundaries
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";

import { redeemMagicToken } from "./actions";
import { AuthLinkGate, resetConsumedAuthTokensForTests } from "./auth-link-gate";
import { usePresentAuthSheet } from "./use-auth-sheet";

jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("./actions", () => ({
  redeemMagicToken: jest.fn(),
}));

const mockPresentAuthSheet = jest.fn();

jest.mock("./use-access", () => ({
  useAccess: jest.fn(() => ({
    kind: "anonymous",
    beginAuth: jest.fn(),
  })),
}));

jest.mock("./use-auth-sheet", () => ({
  usePresentAuthSheet: jest.fn(),
}));

const signedInOutcome = {
  kind: "signed_in" as const,
  user: {
    userId: "user-1",
    email: "ada@trove.ing",
    displayName: "Ada",
  },
};

describe("AuthLinkGate", () => {
  beforeEach(() => {
    resetConsumedAuthTokensForTests();
    jest.mocked(Linking.getInitialURL).mockReset();
    jest.mocked(Linking.addEventListener).mockClear();
    jest.mocked(redeemMagicToken).mockReset();
    jest.mocked(router.replace).mockReset();
    jest.mocked(router.push).mockReset();
    mockPresentAuthSheet.mockReset();
    jest.mocked(usePresentAuthSheet).mockReturnValue(mockPresentAuthSheet);
  });

  afterEach(async () => {
    await cleanup();
  });

  it("presents the auth sheet with a reset grant instead of routing", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(null);

    await render(<AuthLinkGate />);
    await emitUrl("trove://l/reset?token=rst");

    expect(mockPresentAuthSheet).toHaveBeenCalledWith({
      target: { kind: "profile_household" },
      grant: { token: "rst" },
    });
    expect(router.push).not.toHaveBeenCalled();
    expect(redeemMagicToken).not.toHaveBeenCalled();
  });

  it("redeems the same token only once across initial and event URLs", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue("trove://l/magic?token=abc");
    jest.mocked(redeemMagicToken).mockResolvedValue(signedInOutcome);

    await render(<AuthLinkGate />);

    await waitFor(() => {
      expect(redeemMagicToken).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledTimes(1);
    });

    await emitUrl("https://auth.trove.ing/l/magic?token=abc");

    expect(redeemMagicToken).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it("redeems different tokens independently", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue("trove://l/magic?token=abc");
    jest.mocked(redeemMagicToken).mockResolvedValue(signedInOutcome);

    await render(<AuthLinkGate />);
    await waitFor(() => expect(redeemMagicToken).toHaveBeenCalledWith("abc"));

    await emitUrl("https://auth.trove.ing/l/magic?token=def");

    await waitFor(() => {
      expect(redeemMagicToken).toHaveBeenNthCalledWith(1, "abc");
      expect(redeemMagicToken).toHaveBeenNthCalledWith(2, "def");
    });
  });

  it("shows an unusable overlay for an error carrier without redeeming", async () => {
    jest
      .mocked(Linking.getInitialURL)
      .mockResolvedValue("https://auth.trove.ing/l/magic?error=INVALID_TOKEN");

    await render(<AuthLinkGate />);

    expect(await screen.findByText("This link isn't usable")).toBeOnTheScreen();
    expect(redeemMagicToken).not.toHaveBeenCalled();
  });

  it("shows a no-account overlay when redeem reports no_account", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue("trove://l/magic?token=abc");
    jest.mocked(redeemMagicToken).mockResolvedValue({ kind: "no_account" });

    await render(<AuthLinkGate />);

    expect(await screen.findByText("No account yet")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Magic links only work after you create a profile. Create one with a password, then request a fresh link.",
      ),
    ).toBeOnTheScreen();
  });

  it("does not re-redeem after remount for the same initial token", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue("trove://l/magic?token=stay");
    jest.mocked(redeemMagicToken).mockResolvedValue(signedInOutcome);

    const first = await render(<AuthLinkGate />);
    await waitFor(() => expect(redeemMagicToken).toHaveBeenCalledTimes(1));
    first.unmount();

    await render(<AuthLinkGate />);
    await waitFor(() => expect(Linking.getInitialURL).toHaveBeenCalledTimes(2));
    expect(redeemMagicToken).toHaveBeenCalledTimes(1);
  });
});

async function emitUrl(url: string): Promise<void> {
  const listener = jest.mocked(Linking.addEventListener).mock.calls.at(-1)?.[1];
  if (!listener) throw new Error("Expected AuthLinkGate to subscribe to URL events.");

  await act(async () => {
    listener({ url });
  });
}
