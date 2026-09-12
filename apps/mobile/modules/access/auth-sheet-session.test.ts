import { describe, expect, it } from "@jest/globals";

import {
  AUTH_SHEET_CLOSED,
  canPresentAuthSheet,
  openAuthSheetSession,
} from "./auth-sheet-session";
import { returnTo } from "./return-to";
import type { AccessCore, Identity } from "./types";

const user: Identity = {
  userId: "user-1",
  email: "ada@trove.ing",
  displayName: "Ada",
};

describe("AUTH_SHEET_CLOSED", () => {
  it("is the closed AuthSheetSession sentinel", () => {
    expect(AUTH_SHEET_CLOSED).toEqual({ kind: "closed" });
  });

  it("is distinct from an opened session", () => {
    const opened = openAuthSheetSession({ target: returnTo.profileHousehold() });
    expect(AUTH_SHEET_CLOSED.kind).toBe("closed");
    expect(opened.kind).toBe("open");
    expect(AUTH_SHEET_CLOSED).not.toEqual(opened);
  });
});

describe("canPresentAuthSheet", () => {
  it.each([
    { kind: "anonymous" },
    { kind: "session_revoked", lastKnown: user },
  ] satisfies AccessCore[])("allows $kind", (core) => {
    expect(canPresentAuthSheet(core)).toBe(true);
  });

  it.each([
    { kind: "resolving" },
    {
      kind: "signed_in",
      user,
      household: { kind: "none" },
      memberships: [],
      selection: { kind: "personal" },
    },
  ] satisfies AccessCore[])("blocks $kind", (core) => {
    expect(canPresentAuthSheet(core)).toBe(false);
  });
});

describe("openAuthSheetSession", () => {
  it("opens with a target only", () => {
    expect(openAuthSheetSession({ target: returnTo.profileHousehold() })).toEqual({
      kind: "open",
      target: { kind: "profile_household" },
    });
  });

  it("opens with a reset grant", () => {
    expect(
      openAuthSheetSession({
        target: returnTo.profileHousehold(),
        grant: { token: "rst" },
      }),
    ).toEqual({
      kind: "open",
      target: { kind: "profile_household" },
      grant: { token: "rst" },
    });
  });
});
