// oxlint-disable anti-slop/no-module-mocking -- AuthKit client is an opaque network boundary under Jest.
import { describe, expect, it } from "@jest/globals";

import { beginHostedSignIn } from "./actions";

jest.mock("@/lib/auth-client", () => ({
  signInWithAuthKit: jest.fn(),
}));

// SAFETY: Jest mock module shape is fixed by the factory above.
const { signInWithAuthKit } = jest.requireMock("@/lib/auth-client") as {
  signInWithAuthKit: jest.Mock;
};

describe("beginHostedSignIn", () => {
  it("maps a successful AuthKit session to identity", async () => {
    signInWithAuthKit.mockResolvedValue({
      kind: "signed_in",
      user: { id: "user_1", email: "ada@trove.ing", name: "Ada" },
    });
    await expect(beginHostedSignIn()).resolves.toEqual({
      kind: "ok",
      value: { userId: "user_1", email: "ada@trove.ing", displayName: "Ada" },
    });
  });

  it("maps cancellation without treating it as failure", async () => {
    signInWithAuthKit.mockResolvedValue({ kind: "cancelled" });
    await expect(beginHostedSignIn()).resolves.toEqual({ kind: "cancelled" });
  });

  it("maps AuthKit failures through the client error boundary", async () => {
    signInWithAuthKit.mockResolvedValue({ kind: "failed", message: "boom" });
    await expect(beginHostedSignIn()).resolves.toEqual({
      kind: "fail",
      failure: { kind: "server" },
    });
  });
});
