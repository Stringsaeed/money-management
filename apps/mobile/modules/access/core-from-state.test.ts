import { describe, expect, it } from "@jest/globals";

import { coreFromAccess } from "./core-from-state";
import type { AccessState, Identity, MembershipSummary } from "./types";

const user: Identity = {
  userId: "user_1",
  email: "ada@trove.ing",
  displayName: "Ada",
};

const membership: MembershipSummary = {
  householdId: "hh_1",
  name: "Ada Home",
  role: "admin",
  joinedAt: "2026-03-01T00:00:00.000Z",
};

const noopAuth = () => undefined;
const noopSignOut = async () => undefined;
const noopSetActive = async () => undefined;

describe("coreFromAccess", () => {
  it("projects signed_in AccessState into AccessCore without capability fns", () => {
    const access: AccessState = {
      kind: "signed_in",
      user,
      household: { kind: "active", householdId: "hh_1", name: "Ada Home", role: "admin" },
      memberships: [membership],
      selection: { kind: "household", householdId: "hh_1" },
      setActiveHousehold: noopSetActive,
      signOut: noopSignOut,
    };

    expect(coreFromAccess(access)).toEqual({
      kind: "signed_in",
      user,
      household: { kind: "active", householdId: "hh_1", name: "Ada Home", role: "admin" },
      memberships: [membership],
      selection: { kind: "household", householdId: "hh_1" },
    });
  });

  it("strips unavailable household retry when projecting signed_in", () => {
    const access: AccessState = {
      kind: "signed_in",
      user,
      household: { kind: "unavailable", retry: () => undefined },
      memberships: [],
      selection: { kind: "personal" },
      setActiveHousehold: noopSetActive,
      signOut: noopSignOut,
    };

    expect(coreFromAccess(access)).toEqual({
      kind: "signed_in",
      user,
      household: { kind: "unavailable" },
      memberships: [],
      selection: { kind: "personal" },
    });
  });

  it("projects session_revoked to lastKnown only (no reauth/signOut)", () => {
    const access: AccessState = {
      kind: "session_revoked",
      lastKnown: user,
      reauthenticate: noopAuth,
      signOut: noopSignOut,
    };

    expect(coreFromAccess(access)).toEqual({
      kind: "session_revoked",
      lastKnown: user,
    });
  });

  it("projects anonymous and resolving without capability bags", () => {
    expect(coreFromAccess({ kind: "anonymous", beginAuth: noopAuth })).toEqual({
      kind: "anonymous",
    });
    expect(coreFromAccess({ kind: "resolving" })).toEqual({ kind: "resolving" });
  });
});
