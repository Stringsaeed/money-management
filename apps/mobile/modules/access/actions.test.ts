// oxlint-disable anti-slop/no-unknown-returns, anti-slop/no-unknown-parameters -- jest mocks for opaque better-auth client payloads
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { redeemMagicToken } from "./actions";

type VerifyInput = {
  fetchOptions?: {
    onResponse?: (context: { response: { url: string } }) => void;
  };
};

type VerifyResult = {
  readonly data: unknown;
  readonly error: unknown;
};

// SAFETY: jest/setup-env.ts installs this mock shape for the access module.
const authClient = (
  jest.requireMock("@/lib/auth-client") as {
    authClient: {
      magicLink: { verify: jest.Mock<(input?: VerifyInput) => Promise<VerifyResult>> };
      getSession: jest.Mock<() => Promise<VerifyResult>>;
    };
  }
).authClient;

const user = { id: "user-1", email: "ada@trove.ing", name: "Ada" };
const identity = { userId: "user-1", email: "ada@trove.ing", displayName: "Ada" };

function mockVerifyRedirect(url: string) {
  authClient.magicLink.verify.mockImplementation(async (input) => {
    input?.fetchOptions?.onResponse?.({ response: { url } });
    return { data: "OK", error: null };
  });
}

describe("redeemMagicToken", () => {
  beforeEach(() => {
    authClient.magicLink.verify.mockReset();
    authClient.getSession.mockReset();
  });

  it("treats verify body OK as signed_in when a session cookie landed", async () => {
    mockVerifyRedirect("https://auth.trove.ing/");
    // SAFETY: mock session payload only needs id/email/name for identityFromUser.
    authClient.getSession.mockResolvedValue({ data: { user }, error: null });

    await expect(redeemMagicToken("tok")).resolves.toEqual({
      kind: "signed_in",
      user: identity,
    });
  });

  it("treats verify body OK as offline when the session probe cannot reach the server", async () => {
    mockVerifyRedirect("https://auth.trove.ing/");
    authClient.getSession.mockRejectedValue(new TypeError("Network request failed"));

    await expect(redeemMagicToken("tok")).resolves.toEqual({ kind: "offline" });
  });

  it("treats verify body OK as unusable when no session exists", async () => {
    mockVerifyRedirect("https://auth.trove.ing/?error=INVALID_TOKEN");
    // SAFETY: empty session probe shape matches authClient.getSession when signed out.
    authClient.getSession.mockResolvedValue({ data: null, error: null });

    await expect(redeemMagicToken("tok")).resolves.toEqual({
      kind: "unusable",
      operation: "sign_in",
    });
  });

  it("maps new_user_signup_disabled redirect to no_account", async () => {
    mockVerifyRedirect("https://auth.trove.ing/?error=new_user_signup_disabled");

    await expect(redeemMagicToken("tok")).resolves.toEqual({ kind: "no_account" });
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("returns signed_in from verify JSON without probing the session", async () => {
    // SAFETY: mock mirrors better-auth success JSON when callbackURL is omitted.
    authClient.magicLink.verify.mockResolvedValue({
      data: { token: "session-token", user, session: { id: "s1" } },
      error: null,
    });

    await expect(redeemMagicToken("tok")).resolves.toEqual({
      kind: "signed_in",
      user: identity,
    });
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("maps verify transport errors without probing the session", async () => {
    // SAFETY: mock error object only needs status for isUnreachableFailure.
    authClient.magicLink.verify.mockResolvedValue({
      data: null,
      error: { status: 0, message: "failed" },
    });

    await expect(redeemMagicToken("tok")).resolves.toEqual({ kind: "offline" });
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("maps verify client errors without probing the session", async () => {
    // SAFETY: mock error object only needs status/code for failure mapping.
    authClient.magicLink.verify.mockResolvedValue({
      data: null,
      error: { status: 400, code: "INVALID_TOKEN", message: "INVALID_TOKEN" },
    });

    await expect(redeemMagicToken("tok")).resolves.toEqual({
      kind: "unusable",
      operation: "sign_in",
    });
    expect(authClient.getSession).not.toHaveBeenCalled();
  });
});
