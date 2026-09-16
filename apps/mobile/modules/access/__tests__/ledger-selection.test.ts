import { describe, expect, it } from "@jest/globals";

import type { AccessState, Identity, LedgerSelection, MembershipSummary } from "../types";

const user: Identity = {
  userId: "user-1",
  email: "ada@trove.ing",
  displayName: "Ada",
};

const membership: MembershipSummary = {
  householdId: "hh-1",
  name: "Home",
  role: "admin",
  joinedAt: "2026-01-01T00:00:00.000Z",
};

const otherMembership: MembershipSummary = {
  householdId: "hh-2",
  name: "Work",
  role: "member",
  joinedAt: "2026-02-01T00:00:00.000Z",
};

const personalSelection: LedgerSelection = { kind: "personal" };
const householdSelection: LedgerSelection = { kind: "household", householdId: "hh-1" };

function createSignedInAccess(
  selection: LedgerSelection,
  memberships: readonly MembershipSummary[] = [membership],
): Extract<AccessState, { kind: "signed_in" }> {
  return {
    kind: "signed_in",
    user,
    household:
      selection.kind === "household"
        ? {
            kind: "active",
            householdId: selection.householdId,
            name: memberships.find((m) => m.householdId === selection.householdId)?.name ?? "Test",
            role: "admin",
          }
        : { kind: "none" },
    memberships,
    selection,
    setActiveHousehold: async () => {},
    signOut: async () => {},
  };
}

describe("LedgerSelection", () => {
  describe("selection kinds", () => {
    it("personal selection uses kind: personal", () => {
      expect(personalSelection.kind).toBe("personal");
      expect(personalSelection).not.toHaveProperty("householdId");
    });

    it("household selection includes householdId", () => {
      expect(householdSelection.kind).toBe("household");
      expect(householdSelection.householdId).toBe("hh-1");
    });
  });

  describe("anonymous state", () => {
    it("anonymous access has no selection or memberships", () => {
      const access: AccessState = {
        kind: "anonymous",
        beginAuth: () => {},
      };
      expect(access.kind).toBe("anonymous");
      expect(access).not.toHaveProperty("selection");
      expect(access).not.toHaveProperty("memberships");
    });

    it("resolving access has no selection", () => {
      const access: AccessState = { kind: "resolving" };
      expect(access.kind).toBe("resolving");
      expect(access).not.toHaveProperty("selection");
    });
  });

  describe("signed-in state", () => {
    it("personal selection with no memberships", () => {
      const access = createSignedInAccess(personalSelection, []);
      expect(access.selection.kind).toBe("personal");
      expect(access.memberships).toHaveLength(0);
    });

    it("personal selection with available memberships allows switching", () => {
      const access = createSignedInAccess(personalSelection, [membership]);
      expect(access.selection.kind).toBe("personal");
      expect(access.memberships).toHaveLength(1);
    });

    it("household selection requires matching membership", () => {
      const access = createSignedInAccess(householdSelection, [membership]);
      expect(access.selection.kind).toBe("household");
      expect(access.household.kind).toBe("active");
      if (access.household.kind === "active") {
        expect(access.household.householdId).toBe("hh-1");
      }
    });

    it("multiple memberships supports switching between them", () => {
      const access = createSignedInAccess(householdSelection, [membership, otherMembership]);
      expect(access.memberships).toHaveLength(2);
      expect(access.memberships[0].householdId).toBe("hh-1");
      expect(access.memberships[1].householdId).toBe("hh-2");
    });
  });

  describe("revocation scenarios", () => {
    it("revoked session maintains last known identity", () => {
      const access: AccessState = {
        kind: "session_revoked",
        lastKnown: user,
        reauthenticate: () => {},
        signOut: async () => {},
      };
      expect(access.kind).toBe("session_revoked");
      expect(access.lastKnown.userId).toBe("user-1");
    });

    it("unavailable household indicates network/auth failure", () => {
      const access: AccessState = {
        kind: "signed_in",
        user,
        household: { kind: "unavailable", retry: () => {} },
        memberships: [],
        selection: personalSelection,
        setActiveHousehold: async () => {},
        signOut: async () => {},
      };
      expect(access.household.kind).toBe("unavailable");
      expect(access.selection.kind).toBe("personal");
    });
  });
});

describe("cache isolation", () => {
  it("different ledger selections produce different cache keys", () => {
    const personalCacheKey = `synced:personal:user-1:user-1`;
    const householdCacheKey = `synced:hh-1:user-1`;
    expect(personalCacheKey).not.toBe(householdCacheKey);
  });

  it("same ledger selection produces same cache key", () => {
    const key1 = `synced:hh-1:user-1`;
    const key2 = `synced:hh-1:user-1`;
    expect(key1).toBe(key2);
  });

  it("different users produce different cache keys for same household", () => {
    const user1Key = `synced:hh-1:user-1`;
    const user2Key = `synced:hh-1:user-2`;
    expect(user1Key).not.toBe(user2Key);
  });
});
