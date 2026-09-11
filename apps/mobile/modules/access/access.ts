import type { LedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { selectLedgerSource } from "@/modules/ledger-data-source/provider";
import type { LocalOnlyReason, SyncMode } from "@/stores/sync-mode-store";

import { HOUSEHOLDS_KEY } from "./households-key";
import { PROFILE_HOUSEHOLD_HREF } from "./return-to";
import type {
  AccessCore,
  HouseholdAccessCore,
  HouseholdRead,
  Identity,
  IdentityClaim,
  InternalHref,
  LedgerSelection,
  MembershipSummary,
  ResolveAccessInput,
  ReturnTo,
  SessionProbe,
} from "./types";

export type { AccessCore, HouseholdRead, ResolveAccessInput };

export const householdsQueryKeyForUser = (userId: string | null) =>
  [...HOUSEHOLDS_KEY, userId] as const;

export function householdUserIdForQuery(
  claim: IdentityClaim | null,
  probe: SessionProbe | null,
  signedOut: boolean,
): string | null {
  if (signedOut) return null;
  if (probe?.kind === "session") return probe.user.userId;
  return claim?.kind === "held" ? claim.user.userId : null;
}

interface LedgerSourceFacts {
  readonly authenticatedUserId: string | null;
  readonly activeHouseholdId: string | null;
  readonly migratedHouseholdId: string | null;
  readonly personalSyncUserId: string | null;
  readonly offlineReason: string | null;
}

/** What this device has already opted into, read once from local settings. */
export interface SyncEnrollment {
  readonly migratedHouseholdId: string | null;
  readonly personalSyncUserId: string | null;
}

export const NO_SYNC_ENROLLMENT: SyncEnrollment = {
  migratedHouseholdId: null,
  personalSyncUserId: null,
};

export function resolveAccess(input: ResolveAccessInput): AccessCore {
  if (input.probe === null) {
    if (input.claim.kind === "held") {
      return signedInFromSession(input.claim.user, input.households, input.selection);
    }
    return { kind: "resolving" };
  }
  return mergeClaimAndProbe(input.claim, input.probe, input.households, input.selection);
}

export function householdReadFromQuery(input: {
  readonly enabled: boolean;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly memberships?: readonly MembershipSummary[];
}): HouseholdRead {
  if (input.memberships) return { kind: "loaded", memberships: input.memberships };
  if (!input.enabled) return { kind: "loaded", memberships: [] };
  if (input.isPending) return { kind: "pending" };
  if (input.isError) return { kind: "failed" };
  return { kind: "loaded", memberships: [] };
}

export function nextClaim(current: IdentityClaim, probe: SessionProbe, now: Date): IdentityClaim {
  if (probe.kind !== "session") return current;
  if (current.kind === "held" && sameIdentity(current.user, probe.user)) return current;
  return { kind: "held", user: probe.user, establishedAt: now.toISOString() };
}

/**
 * Resolves the selected Household only when the Membership is still active.
 * Personal selection (or a stale Household id) yields null — selection never
 * invents Membership.
 */
export function pickActiveHousehold(
  memberships: readonly MembershipSummary[],
  selection: LedgerSelection,
): Extract<HouseholdAccessCore, { kind: "active" }> | null {
  if (selection.kind !== "household") return null;
  const picked = memberships.find((row) => row.householdId === selection.householdId);
  if (!picked) return null;
  return {
    kind: "active",
    householdId: picked.householdId,
    name: picked.name,
    role: picked.role,
  };
}

export function resolveReturnDestination(access: AccessCore, target: ReturnTo): InternalHref {
  if (
    access.kind === "signed_in" &&
    access.household.kind === "active" &&
    target.kind === "screen"
  ) {
    return target.href;
  }
  return PROFILE_HOUSEHOLD_HREF;
}

export function selectLedgerSourceForAccess(
  access: AccessCore,
  enrollment: SyncEnrollment,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): LedgerSourceSelection {
  return selectLedgerSource(ledgerFactsForAccess(access, enrollment, mode, reason));
}

function mergeClaimAndProbe(
  claim: IdentityClaim,
  probe: SessionProbe,
  households: HouseholdRead,
  selection: LedgerSelection,
): AccessCore {
  if (probe.kind === "no_session") {
    return claim.kind === "held"
      ? { kind: "session_revoked", lastKnown: claim.user, selection }
      : { kind: "anonymous" };
  }
  if (probe.kind === "unreachable") {
    return claim.kind === "held"
      ? signedInUnavailable(claim.user, selection)
      : { kind: "anonymous" };
  }
  return signedInFromSession(probe.user, households, selection);
}

function signedInFromSession(
  user: Identity,
  households: HouseholdRead,
  selection: LedgerSelection,
): AccessCore {
  if (households.kind === "pending") return { kind: "resolving" };
  if (households.kind === "failed") return signedInUnavailable(user, selection);
  const active = pickActiveHousehold(households.memberships, selection);
  return {
    kind: "signed_in",
    user,
    household: active ?? { kind: "none" },
    memberships: households.memberships,
    selection,
  };
}

function signedInUnavailable(user: Identity, selection: LedgerSelection): AccessCore {
  return {
    kind: "signed_in",
    user,
    household: { kind: "unavailable" },
    memberships: [],
    selection,
  };
}

function sameIdentity(left: Identity, right: Identity): boolean {
  return (
    left.userId === right.userId &&
    left.email === right.email &&
    left.displayName === right.displayName
  );
}

function ledgerFactsForAccess(
  access: AccessCore,
  enrollment: SyncEnrollment,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): LedgerSourceFacts {
  if (access.kind === "resolving" || access.kind === "anonymous") {
    return localFacts(enrollment);
  }
  if (access.kind === "session_revoked") {
    return revokedFacts(access.lastKnown.userId, access.selection, enrollment);
  }
  return signedInFacts(access, enrollment, mode, reason);
}

function localFacts(enrollment: SyncEnrollment): LedgerSourceFacts {
  return {
    authenticatedUserId: null,
    activeHouseholdId: null,
    ...enrollment,
    offlineReason: null,
  };
}

function revokedFacts(
  userId: string,
  selection: LedgerSelection,
  enrollment: SyncEnrollment,
): LedgerSourceFacts {
  return {
    authenticatedUserId: userId,
    activeHouseholdId: selection.kind === "household" ? selection.householdId : null,
    ...enrollment,
    offlineReason: "Signed out remotely. Your ledger is safe on this device.",
  };
}

function signedInFacts(
  access: Extract<AccessCore, { kind: "signed_in" }>,
  enrollment: SyncEnrollment,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): LedgerSourceFacts {
  return {
    authenticatedUserId: access.user.userId,
    activeHouseholdId: activeHouseholdIdForSignedIn(access),
    ...enrollment,
    offlineReason: offlineReasonForSignedIn(access, enrollment, mode, reason),
  };
}

function activeHouseholdIdForSignedIn(
  access: Extract<AccessCore, { kind: "signed_in" }>,
): string | null {
  if (access.household.kind === "active") return access.household.householdId;
  if (access.household.kind === "unavailable" && access.selection.kind === "household") {
    return access.selection.householdId;
  }
  return null;
}

function offlineReasonForSignedIn(
  access: Extract<AccessCore, { kind: "signed_in" }>,
  enrollment: SyncEnrollment,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): string | null {
  // Only a device that lives in a Household is degraded by a failed
  // household read; a Personal Ledger never consults that list.
  if (access.household.kind === "unavailable" && access.selection.kind === "household") {
    return "Household sync is temporarily unavailable.";
  }
  if (mode === "local_only" && reason === "kill_switch") {
    return "Sync is temporarily unavailable.";
  }
  if (mode === "local_only") return "PowerSync has been disconnected for over 10 minutes.";
  return null;
}
