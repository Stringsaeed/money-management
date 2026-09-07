import type {
  AccessCore,
  HouseholdRead,
  Identity,
  IdentityClaim,
  MembershipSummary,
  SessionProbe,
} from "./types";
import { describe, expect, it } from "@jest/globals";

import {
  householdReadFromQuery,
  nextClaim,
  pickActiveHousehold,
  resolveAccess,
  resolveReturnDestination,
  selectLedgerSourceForAccess,
} from "./access";
import { PROFILE_HOUSEHOLD_HREF, returnTo } from "./return-to";

const user: Identity = {
  userId: "user-1",
  email: "ada@trove.ing",
  displayName: "Ada",
};

const other: Identity = {
  userId: "user-2",
  email: "grace@trove.ing",
  displayName: "Grace",
};

const activeMembership: MembershipSummary = {
  householdId: "hh-1",
  name: "Home",
  role: "owner",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const loadedActive: HouseholdRead = {
  kind: "loaded",
  memberships: [activeMembership],
};

const held: IdentityClaim = {
  kind: "held",
  user,
  establishedAt: "2026-02-01T00:00:00.000Z",
};

const signedInActive: AccessCore = {
  kind: "signed_in",
  user,
  household: {
    kind: "active",
    householdId: "hh-1",
    name: "Home",
    role: "owner",
  },
  memberships: [activeMembership],
};

describe("resolveAccess", () => {
  it.each([
    {
      name: "none x session",
      claim: { kind: "none" } as const,
      probe: { kind: "session", user } as const,
      households: loadedActive,
      expected: signedInActive,
    },
    {
      name: "none x no_session",
      claim: { kind: "none" } as const,
      probe: { kind: "no_session" } as const,
      households: loadedActive,
      expected: { kind: "anonymous" },
    },
    {
      name: "none x unreachable",
      claim: { kind: "none" } as const,
      probe: { kind: "unreachable" } as const,
      households: loadedActive,
      expected: { kind: "anonymous" },
    },
    {
      name: "held x session",
      claim: held,
      probe: { kind: "session", user } as const,
      households: loadedActive,
      expected: signedInActive,
    },
    {
      name: "held x no_session",
      claim: held,
      probe: { kind: "no_session" } as const,
      households: loadedActive,
      expected: { kind: "session_revoked", lastKnown: user },
    },
    {
      name: "held x unreachable",
      claim: held,
      probe: { kind: "unreachable" } as const,
      households: loadedActive,
      expected: {
        kind: "signed_in",
        user,
        household: { kind: "unavailable" },
        memberships: [],
      },
    },
    {
      name: "none x null probe",
      claim: { kind: "none" } as const,
      probe: null,
      households: loadedActive,
      expected: { kind: "resolving" },
    },
    {
      name: "held x null probe",
      claim: held,
      probe: null,
      households: loadedActive,
      expected: signedInActive,
    },
    {
      name: "session x households pending",
      claim: held,
      probe: { kind: "session", user } as const,
      households: { kind: "pending" } as const,
      expected: { kind: "resolving" },
    },
  ] satisfies {
    name: string;
    claim: IdentityClaim;
    probe: SessionProbe | null;
    households: HouseholdRead;
    expected: AccessCore;
  }[])("$name", ({ claim, probe, households, expected }) => {
    expect(resolveAccess({ claim, probe, households })).toEqual(expected);
  });

  it("keeps signed_in when listMine fails instead of treating it as signed out", () => {
    expect(
      resolveAccess({
        claim: held,
        probe: { kind: "session", user },
        households: { kind: "failed" },
      }),
    ).toEqual({
      kind: "signed_in",
      user,
      household: { kind: "unavailable" },
      memberships: [],
    });
  });

  it("never turns unreachable into session_revoked", () => {
    const access = resolveAccess({
      claim: held,
      probe: { kind: "unreachable" },
      households: { kind: "failed" },
    });
    expect(access.kind).toBe("signed_in");
    expect(access).not.toMatchObject({ kind: "session_revoked" });
  });
});

describe("nextClaim", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");

  it("writes a held claim from a session probe", () => {
    expect(nextClaim({ kind: "none" }, { kind: "session", user }, now)).toEqual({
      kind: "held",
      user,
      establishedAt: now.toISOString(),
    });
  });

  it("leaves the claim unchanged when the identity already matches", () => {
    expect(nextClaim(held, { kind: "session", user }, now)).toBe(held);
  });

  it("does not clear a held claim on an authoritative no_session", () => {
    expect(nextClaim(held, { kind: "no_session" }, now)).toBe(held);
  });

  it("rewrites when the session identity changes", () => {
    expect(nextClaim(held, { kind: "session", user: other }, now)).toEqual({
      kind: "held",
      user: other,
      establishedAt: now.toISOString(),
    });
  });
});

describe("pickActiveHousehold", () => {
  it("returns at most one active household, preferring the newest createdAt", () => {
    const older: MembershipSummary = {
      ...activeMembership,
      householdId: "hh-old",
      name: "Old",
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    const newer: MembershipSummary = {
      ...activeMembership,
      householdId: "hh-new",
      name: "New",
      createdAt: "2026-06-01T00:00:00.000Z",
    };
    expect(pickActiveHousehold([older, newer])).toEqual({
      kind: "active",
      householdId: "hh-new",
      name: "New",
      role: "owner",
    });
  });

  it("returns null when no membership is active", () => {
    expect(pickActiveHousehold([{ ...activeMembership, isActive: false }])).toBeNull();
  });
});

describe("resolveReturnDestination", () => {
  it("returns the invoking screen when an active household exists", () => {
    expect(resolveReturnDestination(signedInActive, returnTo.parse("/(tabs)"))).toBe("/(tabs)");
  });

  it("returns Profile & household when there is no active household", () => {
    expect(
      resolveReturnDestination(
        { kind: "signed_in", user, household: { kind: "none" }, memberships: [] },
        returnTo.parse("/(tabs)"),
      ),
    ).toBe(PROFILE_HOUSEHOLD_HREF);
  });

  it("returns Profile & household for revoked and anonymous access", () => {
    expect(
      resolveReturnDestination(
        { kind: "session_revoked", lastKnown: user },
        returnTo.parse("/(tabs)"),
      ),
    ).toBe(PROFILE_HOUSEHOLD_HREF);
    expect(resolveReturnDestination({ kind: "anonymous" }, returnTo.profileHousehold())).toBe(
      PROFILE_HOUSEHOLD_HREF,
    );
  });
});

describe("selectLedgerSourceForAccess", () => {
  it("never full-screen-blocks on session_revoked", () => {
    expect(
      selectLedgerSourceForAccess(
        { kind: "session_revoked", lastKnown: user },
        null,
        "synced",
        null,
      ).kind,
    ).toBe("local");
    expect(
      selectLedgerSourceForAccess(
        { kind: "session_revoked", lastKnown: user },
        "hh-1",
        "synced",
        null,
      ),
    ).toEqual({
      kind: "synced",
      householdId: "hh-1",
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "Signed out remotely. Your ledger is safe on this device.",
      },
    });
  });

  it("never full-screen-blocks when listMine is unavailable", () => {
    const unavailable: AccessCore = {
      kind: "signed_in",
      user,
      household: { kind: "unavailable" },
      memberships: [],
    };
    expect(selectLedgerSourceForAccess(unavailable, null, "synced", null).kind).toBe("local");
    expect(selectLedgerSourceForAccess(unavailable, "hh-1", "synced", null)).toEqual({
      kind: "synced",
      householdId: "hh-1",
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "Household sync is temporarily unavailable.",
      },
    });
  });

  it("selects a live synced ledger only for the migrated active household", () => {
    expect(selectLedgerSourceForAccess(signedInActive, "hh-1", "synced", null)).toEqual({
      kind: "synced",
      householdId: "hh-1",
      userId: "user-1",
    });
    expect(selectLedgerSourceForAccess(signedInActive, "hh-other", "synced", null)).toEqual({
      kind: "local",
    });
  });

  it("keeps the migrated ledger selected while the session probe is in flight", () => {
    const access = resolveAccess({
      claim: held,
      probe: null,
      households: loadedActive,
    });
    expect(selectLedgerSourceForAccess(access, "hh-1", "synced", null)).toEqual({
      kind: "synced",
      householdId: "hh-1",
      userId: "user-1",
    });
  });
});

describe("householdReadFromQuery", () => {
  it("keeps cached memberships when the session probe disables the query", () => {
    expect(
      householdReadFromQuery({
        enabled: false,
        isPending: false,
        isError: false,
        memberships: [activeMembership],
      }),
    ).toEqual(loadedActive);
  });

  it("stays pending only before the first household page arrives", () => {
    expect(
      householdReadFromQuery({
        enabled: true,
        isPending: true,
        isError: false,
      }),
    ).toEqual({ kind: "pending" });
  });
});
