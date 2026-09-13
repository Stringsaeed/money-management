import { describe, expect, it } from "@jest/globals";

import { isUnreachableFailure } from "../client-error";
import { mapSessionSnapshot } from "../session-probe";

const user = { id: "user-1", email: "ada@trove.ing", name: "Ada" };

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
