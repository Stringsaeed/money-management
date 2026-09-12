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
  NO_SYNC_ENROLLMENT,
  householdReadFromQuery,
  householdUserIdForQuery,
  householdsQueryKeyForUser,
  nextClaim,
  normalizeLedgerSelection,
  pickActiveHousehold,
  resolveAccess,
  resolveReturnDestination,
  selectLedgerSourceForAccess,
  type SyncEnrollment,
} from "./access";
import { householdLedgerBinding } from "@/modules/ledger-data-source/provider";
import { PROFILE_HOUSEHOLD_HREF, returnTo } from "./return-to";

const migratedTo = (householdId: string): SyncEnrollment => ({
  migratedHouseholdId: householdId,
  personalSyncUserId: null,
});

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
  role: "admin",
  joinedAt: "2026-01-01T00:00:00.000Z",
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

const householdSelection = { kind: "household", householdId: "hh-1" } as const;
const personalSelection = { kind: "personal" } as const;

const signedInActive: AccessCore = {
  kind: "signed_in",
  user,
  household: {
    kind: "active",
    householdId: "hh-1",
    name: "Home",
    role: "admin",
  },
  memberships: [activeMembership],
  selection: householdSelection,
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
        selection: personalSelection,
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
    expect(resolveAccess({ claim, probe, households, selection: householdSelection })).toEqual(
      expected,
    );
  });

  it("keeps signed_in when listMine fails instead of treating it as signed out", () => {
    expect(
      resolveAccess({
        claim: held,
        probe: { kind: "session", user },
        households: { kind: "failed" },
        selection: householdSelection,
      }),
    ).toEqual({
      kind: "signed_in",
      user,
      household: { kind: "unavailable" },
      memberships: [],
      selection: personalSelection,
    });
  });

  it("never turns unreachable into session_revoked", () => {
    const access = resolveAccess({
      claim: held,
      probe: { kind: "unreachable" },
      households: { kind: "failed" },
      selection: householdSelection,
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

describe("normalizeLedgerSelection", () => {
  it("keeps Personal selection unchanged", () => {
    expect(normalizeLedgerSelection([activeMembership], personalSelection)).toEqual(
      personalSelection,
    );
  });

  it("keeps a Household selection that still has membership", () => {
    expect(normalizeLedgerSelection([activeMembership], householdSelection)).toEqual(
      householdSelection,
    );
  });

  it("falls back to Personal when the selected Household id is stale", () => {
    expect(normalizeLedgerSelection([], { kind: "household", householdId: "hh-gone" })).toEqual(
      personalSelection,
    );
    expect(
      normalizeLedgerSelection([activeMembership], {
        kind: "household",
        householdId: "hh-gone",
      }),
    ).toEqual(personalSelection);
  });
});

describe("pickActiveHousehold", () => {
  it("returns the selected household when membership still exists", () => {
    const other: MembershipSummary = {
      ...activeMembership,
      householdId: "hh-2",
      name: "Other",
      joinedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(
      pickActiveHousehold([activeMembership, other], {
        kind: "household",
        householdId: "hh-2",
      }),
    ).toEqual({
      kind: "active",
      householdId: "hh-2",
      name: "Other",
      role: "admin",
    });
  });

  it("returns null for Personal selection or unknown household ids", () => {
    expect(pickActiveHousehold([activeMembership], { kind: "personal" })).toBeNull();
    expect(pickActiveHousehold([], { kind: "household", householdId: "hh-1" })).toBeNull();
  });
});

describe("resolveReturnDestination", () => {
  it("returns the invoking screen when an active household exists", () => {
    expect(resolveReturnDestination(signedInActive, returnTo.parse("/(tabs)"))).toBe("/(tabs)");
  });

  it("returns Profile & household when there is no active household", () => {
    expect(
      resolveReturnDestination(
        {
          kind: "signed_in",
          user,
          household: { kind: "none" },
          memberships: [],
          selection: personalSelection,
        },
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
        NO_SYNC_ENROLLMENT,
        "synced",
        null,
      ).kind,
    ).toBe("local");
    expect(
      selectLedgerSourceForAccess(
        { kind: "session_revoked", lastKnown: user },
        migratedTo("hh-1"),
        "synced",
        null,
      ),
    ).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("hh-1"),
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
      selection: personalSelection,
    };
    expect(selectLedgerSourceForAccess(unavailable, NO_SYNC_ENROLLMENT, "synced", null).kind).toBe(
      "local",
    );
    expect(selectLedgerSourceForAccess(unavailable, migratedTo("hh-1"), "synced", null)).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("hh-1"),
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "Household sync is temporarily unavailable.",
      },
    });
  });

  it("selects a live synced ledger only for the migrated active household", () => {
    expect(selectLedgerSourceForAccess(signedInActive, migratedTo("hh-1"), "synced", null)).toEqual(
      {
        kind: "synced",
        ledger: householdLedgerBinding("hh-1"),
        userId: "user-1",
      },
    );
    expect(
      selectLedgerSourceForAccess(signedInActive, migratedTo("hh-other"), "synced", null),
    ).toEqual({
      kind: "local",
    });
  });

  it("keeps the migrated ledger selected while the session probe is in flight", () => {
    const access = resolveAccess({
      claim: held,
      probe: null,
      households: loadedActive,
      selection: householdSelection,
    });
    expect(selectLedgerSourceForAccess(access, migratedTo("hh-1"), "synced", null)).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("hh-1"),
      userId: "user-1",
    });
  });

  it("syncs a Personal Ledger for a signed-in user who never joined a Household", () => {
    const noHousehold: AccessCore = {
      kind: "signed_in",
      user,
      household: { kind: "none" },
      memberships: [],
      selection: personalSelection,
    };
    const enrollment: SyncEnrollment = {
      migratedHouseholdId: null,
      personalSyncUserId: "user-1",
    };
    expect(selectLedgerSourceForAccess(noHousehold, enrollment, "synced", null)).toEqual({
      kind: "synced",
      ledger: { ledgerId: "personal:user-1", scope: { type: "personal" }, householdId: null },
      userId: "user-1",
    });
  });

  it("does not degrade a Personal Ledger when the household list fails to load", () => {
    const unavailable: AccessCore = {
      kind: "signed_in",
      user,
      household: { kind: "unavailable" },
      memberships: [],
      selection: personalSelection,
    };
    const enrollment: SyncEnrollment = {
      migratedHouseholdId: null,
      personalSyncUserId: "user-1",
    };
    expect(selectLedgerSourceForAccess(unavailable, enrollment, "synced", null)).toEqual({
      kind: "synced",
      ledger: { ledgerId: "personal:user-1", scope: { type: "personal" }, householdId: null },
      userId: "user-1",
    });
  });

  it("marks the migrated ledger offline_cached when sync mode is kill_switch local_only", () => {
    expect(
      selectLedgerSourceForAccess(signedInActive, migratedTo("hh-1"), "local_only", "kill_switch"),
    ).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("hh-1"),
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "Sync is temporarily unavailable.",
      },
    });
  });

  it("marks the migrated ledger offline_cached when sync mode is powersync local_only", () => {
    expect(
      selectLedgerSourceForAccess(
        signedInActive,
        migratedTo("hh-1"),
        "local_only",
        "powersync_unavailable",
      ),
    ).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("hh-1"),
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "PowerSync has been disconnected for over 10 minutes.",
      },
    });
  });
});

describe("householdReadFromQuery", () => {
  it("uses the live session identity instead of a prior held claim", () => {
    expect(householdUserIdForQuery(held, { kind: "session", user: other }, false)).toBe("user-2");
    expect(householdUserIdForQuery(held, null, false)).toBe("user-1");
    expect(householdUserIdForQuery(held, { kind: "session", user: other }, true)).toBeNull();
  });

  it("keeps cached household pages isolated by authenticated user", () => {
    expect(householdsQueryKeyForUser("user-1")).toEqual(["households", "user-1"]);
    expect(householdsQueryKeyForUser("user-2")).toEqual(["households", "user-2"]);
    expect(householdsQueryKeyForUser("user-1")).not.toEqual(householdsQueryKeyForUser("user-2"));
  });

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
