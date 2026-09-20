import { describe, expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  householdLedgerBinding,
  LedgerDataSourceProvider,
  personalLedgerBinding,
  type LedgerSourceSelection,
} from "@/modules/ledger-data-source/provider";

import { AccessContext } from "../use-access";
import { useLedgerScope, type LedgerScope } from "../use-ledger-scope";
import type { AccessState, Identity, MembershipSummary } from "../types";

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

function createWrapper(access: AccessState, ledgerSelection?: LedgerSourceSelection) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LedgerDataSourceProvider selection={ledgerSelection ?? { kind: "local" }}>
        <AccessContext value={access}>{children}</AccessContext>
      </LedgerDataSourceProvider>
    );
  };
}

describe("useLedgerScope", () => {
  describe("anonymous state", () => {
    it("returns local_anonymous for anonymous users", async () => {
      const access: AccessState = {
        kind: "anonymous",
        beginAuth: () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, { kind: "local" }),
      });
      const scope: LedgerScope = result.current;
      expect(scope.kind).toBe("local_anonymous");
      expect(scope.selection.kind).toBe("personal");
      expect(scope.householdId).toBeNull();
      expect(scope.canSwitch).toBe(false);
      expect(scope.setActiveHousehold).toBeNull();
    });

    it("returns local_anonymous for resolving state", async () => {
      const access: AccessState = { kind: "resolving" };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, { kind: "local" }),
      });
      expect(result.current.kind).toBe("local_anonymous");
      expect(result.current.canSwitch).toBe(false);
    });

    it("returns local_anonymous for session_revoked", async () => {
      const access: AccessState = {
        kind: "session_revoked",
        lastKnown: user,
        reauthenticate: () => {},
        signOut: async () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, { kind: "local" }),
      });
      expect(result.current.kind).toBe("local_anonymous");
    });
  });

  describe("personal selection", () => {
    it("returns personal kind for signed-in user with personal selection", async () => {
      const access: AccessState = {
        kind: "signed_in",
        user,
        household: { kind: "none" },
        memberships: [],
        selection: { kind: "personal" },
        setActiveHousehold: async () => {},
        signOut: async () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, {
          kind: "synced",
          ledger: personalLedgerBinding("user-1"),
          userId: "user-1",
        }),
      });
      expect(result.current.kind).toBe("personal");
      expect(result.current.selection.kind).toBe("personal");
      expect(result.current.householdId).toBeNull();
      expect(result.current.householdName).toBeNull();
    });

    it("canSwitch is true when memberships exist", async () => {
      const access: AccessState = {
        kind: "signed_in",
        user,
        household: { kind: "none" },
        memberships: [membership],
        selection: { kind: "personal" },
        setActiveHousehold: async () => {},
        signOut: async () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, {
          kind: "synced",
          ledger: personalLedgerBinding("user-1"),
          userId: "user-1",
        }),
      });
      expect(result.current.canSwitch).toBe(true);
      expect(result.current.availableHouseholds).toHaveLength(1);
    });

    it("canSwitch is false when no memberships", async () => {
      const access: AccessState = {
        kind: "signed_in",
        user,
        household: { kind: "none" },
        memberships: [],
        selection: { kind: "personal" },
        setActiveHousehold: async () => {},
        signOut: async () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, {
          kind: "synced",
          ledger: personalLedgerBinding("user-1"),
          userId: "user-1",
        }),
      });
      expect(result.current.canSwitch).toBe(false);
      expect(result.current.availableHouseholds).toHaveLength(0);
    });
  });

  describe("household selection", () => {
    it("returns household kind with household details", async () => {
      const setActiveHousehold = async (_id: string | null) => {};
      const access: AccessState = {
        kind: "signed_in",
        user,
        household: {
          kind: "active",
          householdId: "hh-1",
          name: "Home",
          role: "admin",
        },
        memberships: [membership],
        selection: { kind: "household", householdId: "hh-1" },
        setActiveHousehold,
        signOut: async () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, {
          kind: "synced",
          ledger: householdLedgerBinding("hh-1"),
          userId: "user-1",
        }),
      });
      expect(result.current.kind).toBe("household");
      expect(result.current.householdId).toBe("hh-1");
      expect(result.current.householdName).toBe("Home");
      expect(result.current.setActiveHousehold).toBe(setActiveHousehold);
    });

    it("provides multiple households for switching", async () => {
      const access: AccessState = {
        kind: "signed_in",
        user,
        household: {
          kind: "active",
          householdId: "hh-1",
          name: "Home",
          role: "admin",
        },
        memberships: [membership, otherMembership],
        selection: { kind: "household", householdId: "hh-1" },
        setActiveHousehold: async () => {},
        signOut: async () => {},
      };
      const { result } = await renderHook(() => useLedgerScope(), {
        wrapper: createWrapper(access, {
          kind: "synced",
          ledger: householdLedgerBinding("hh-1"),
          userId: "user-1",
        }),
      });
      expect(result.current.canSwitch).toBe(true);
      expect(result.current.availableHouseholds).toHaveLength(2);
      expect(result.current.availableHouseholds[0].name).toBe("Home");
      expect(result.current.availableHouseholds[1].name).toBe("Work");
    });
  });
});
