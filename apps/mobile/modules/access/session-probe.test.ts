import { beforeEach, describe, expect, it } from "@jest/globals";

import { isUnreachableFailure } from "./client-error";
import { mapSessionSnapshot, probeSession, tryRemoteSignOut } from "./session-probe";

const user = { id: "user-1", email: "ada@trove.ing", name: "Ada" };

// Global authClient mock lives in jest/setup-env.ts; drive outcomes here.
// SAFETY: Jest mock module shape is fixed by jest/setup-env.ts.
const { authClient } = jest.requireMock("@/lib/auth-client") as {
  authClient: {
    getSession: jest.Mock;
    signOut: jest.Mock;
  };
};

describe("mapSessionSnapshot", () => {
  it("maps a live session user", () => {
    expect(mapSessionSnapshot({ data: { user }, isPending: false })).toEqual({
      kind: "session",
      user: { userId: "user-1", email: "ada@trove.ing", displayName: "Ada" },
    });
  });

  it("stays unresolved while the first probe is in flight", () => {
    expect(mapSessionSnapshot({ data: null, isPending: true })).toBeNull();
  });

  it("maps an authoritative empty session", () => {
    expect(mapSessionSnapshot({ data: null, isPending: false })).toEqual({ kind: "no_session" });
  });

  it("maps transport failure as unreachable, never no_session", () => {
    expect(
      mapSessionSnapshot({
        data: null,
        isPending: false,
        error: { status: 503, message: "unavailable" },
      }),
    ).toEqual({ kind: "unreachable" });
    expect(mapSessionSnapshot({ data: { user }, isPending: true, error: { status: 503 } })).toEqual(
      {
        kind: "session",
        user: { userId: "user-1", email: "ada@trove.ing", displayName: "Ada" },
      },
    );
  });
});

describe("isUnreachableFailure", () => {
  it("treats 401 as reachable", () => {
    expect(isUnreachableFailure({ status: 401, message: "UNAUTHORIZED" })).toBe(false);
  });

  it("treats network failures as unreachable", () => {
    expect(isUnreachableFailure(new TypeError("Failed to fetch"))).toBe(true);
    expect(isUnreachableFailure({ message: "Network request failed" })).toBe(true);
  });
});

describe("probeSession", () => {
  beforeEach(() => {
    authClient.getSession.mockReset();
  });

  it("returns a session identity when getSession has a user", async () => {
    authClient.getSession.mockResolvedValue({ data: { user }, isPending: false });
    await expect(probeSession()).resolves.toEqual({
      kind: "session",
      user: { userId: "user-1", email: "ada@trove.ing", displayName: "Ada" },
    });
  });

  it("returns no_session when getSession is empty", async () => {
    authClient.getSession.mockResolvedValue({ data: null, isPending: false });
    await expect(probeSession()).resolves.toEqual({ kind: "no_session" });
  });

  it("returns unreachable when getSession throws a transport failure", async () => {
    authClient.getSession.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(probeSession()).resolves.toEqual({ kind: "unreachable" });
  });

  it("returns no_session when getSession throws a reachable auth failure", async () => {
    authClient.getSession.mockRejectedValue(new Error("UNAUTHORIZED"));
    await expect(probeSession()).resolves.toEqual({ kind: "no_session" });
  });
});

describe("tryRemoteSignOut", () => {
  beforeEach(() => {
    authClient.signOut.mockReset();
  });

  it("returns ok when remote sign-out succeeds", async () => {
    authClient.signOut.mockResolvedValue(undefined);
    await expect(tryRemoteSignOut()).resolves.toBe("ok");
  });

  it("returns unreachable when remote sign-out hits a transport failure", async () => {
    authClient.signOut.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(tryRemoteSignOut()).resolves.toBe("unreachable");
  });

  it("returns ok when remote sign-out fails with a reachable error", async () => {
    authClient.signOut.mockRejectedValue(new Error("UNAUTHORIZED"));
    await expect(tryRemoteSignOut()).resolves.toBe("ok");
  });
});
