import type {
  AccessCore,
  AccessState,
  HouseholdAccess,
  HouseholdAccessCore,
  ReturnTo,
} from "./types";

export function attachCapabilities(
  core: AccessCore,
  deps: {
    readonly beginAuth: (target: ReturnTo) => void;
    readonly signOut: () => Promise<void>;
    readonly selectLedger: (householdId: string | null) => Promise<void>;
    readonly retryHouseholds: () => void;
  },
): AccessState {
  if (core.kind === "resolving") return { kind: "resolving" };
  if (core.kind === "anonymous") {
    return { kind: "anonymous", beginAuth: deps.beginAuth };
  }
  if (core.kind === "session_revoked") {
    return {
      kind: "session_revoked",
      lastKnown: core.lastKnown,
      selection: core.selection,
      reauthenticate: deps.beginAuth,
      signOut: deps.signOut,
    };
  }
  return {
    kind: "signed_in",
    user: core.user,
    household: householdWithRetry(core.household, deps.retryHouseholds),
    memberships: core.memberships,
    selection: core.selection,
    selectLedger: deps.selectLedger,
    signOut: deps.signOut,
  };
}

function householdWithRetry(household: HouseholdAccessCore, retry: () => void): HouseholdAccess {
  if (household.kind === "unavailable") return { kind: "unavailable", retry };
  return household;
}
