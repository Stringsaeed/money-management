import { describe, expect, it, jest } from "@jest/globals";

import { attachCapabilities } from "./capabilities";
import type { AccessCore, Identity, MembershipSummary } from "./types";

const user: Identity = {
  userId: "user_1",
  email: "ada@trove.ing",
  displayName: "Ada",
};

const membership: MembershipSummary = {
  householdId: "hh_1",
  name: "Ada Home",
  role: "member",
  joinedAt: "2026-04-01T00:00:00.000Z",
};

describe("attachCapabilities", () => {
  const beginAuth = jest.fn();
  const signOut = jest.fn(async () => undefined);
  const setActiveHousehold = jest.fn(async () => undefined);
  const retryHouseholds = jest.fn();
  const deps = { beginAuth, signOut, setActiveHousehold, retryHouseholds };

  it("passes resolving and anonymous cores through with beginAuth only on anonymous", () => {
    expect(attachCapabilities({ kind: "resolving" }, deps)).toEqual({ kind: "resolving" });

    const anonymous = attachCapabilities({ kind: "anonymous" }, deps);
    expect(anonymous).toEqual({ kind: "anonymous", beginAuth });
  });

  it("reattaches reauthenticate + signOut on session_revoked", () => {
    const core: AccessCore = { kind: "session_revoked", lastKnown: user };
    expect(attachCapabilities(core, deps)).toEqual({
      kind: "session_revoked",
      lastKnown: user,
      reauthenticate: beginAuth,
      signOut,
    });
  });

  it("reattaches signed_in actions and preserves active household", () => {
    const core: AccessCore = {
      kind: "signed_in",
      user,
      household: { kind: "active", householdId: "hh_1", name: "Ada Home", role: "member" },
      memberships: [membership],
      selection: { kind: "household", householdId: "hh_1" },
    };

    expect(attachCapabilities(core, deps)).toEqual({
      kind: "signed_in",
      user,
      household: { kind: "active", householdId: "hh_1", name: "Ada Home", role: "member" },
      memberships: [membership],
      selection: { kind: "household", householdId: "hh_1" },
      setActiveHousehold,
      signOut,
    });
  });

  it("wraps unavailable household with retry from deps", () => {
    const core: AccessCore = {
      kind: "signed_in",
      user,
      household: { kind: "unavailable" },
      memberships: [],
      selection: { kind: "personal" },
    };

    const access = attachCapabilities(core, deps);
    expect(access.kind).toBe("signed_in");
    if (access.kind !== "signed_in") return;
    expect(access.household.kind).toBe("unavailable");
    if (access.household.kind !== "unavailable") return;
    access.household.retry();
    expect(retryHouseholds).toHaveBeenCalledTimes(1);
  });
});
