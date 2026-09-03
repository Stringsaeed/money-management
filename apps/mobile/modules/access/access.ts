import type { LedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { selectLedgerSource } from "@/modules/ledger-data-source/provider";
import type { LocalOnlyReason, SyncMode } from "@/stores/sync-mode-store";

import { PROFILE_HOUSEHOLD_HREF } from "./return-to";
import type {
  AccessCore,
  HouseholdAccessCore,
  HouseholdRead,
  Identity,
  IdentityClaim,
  InternalHref,
  MembershipSummary,
  ResolveAccessInput,
  ReturnTo,
  SessionProbe,
} from "./types";

export type { AccessCore, HouseholdRead, ResolveAccessInput };

interface LedgerSourceFacts {
  readonly authenticatedUserId: string | null;
  readonly activeHouseholdId: string | null;
  readonly migratedHouseholdId: string | null;
  readonly offlineReason: string | null;
}

export function resolveAccess(input: ResolveAccessInput): AccessCore {
  if (input.probe === null) return { kind: "resolving" };
  return mergeClaimAndProbe(input.claim, input.probe, input.households);
}

export function nextClaim(current: IdentityClaim, probe: SessionProbe, now: Date): IdentityClaim {
  if (probe.kind !== "session") return current;
  if (current.kind === "held" && sameIdentity(current.user, probe.user)) return current;
  return { kind: "held", user: probe.user, establishedAt: now.toISOString() };
}

export function pickActiveHousehold(
  memberships: readonly MembershipSummary[],
): Extract<HouseholdAccessCore, { kind: "active" }> | null {
  const active = memberships.filter((row) => row.isActive);
  if (active.length === 0) return null;
  const picked = active.reduce(newerMembership);
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
  migratedHouseholdId: string | null,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): LedgerSourceSelection {
  return selectLedgerSource(ledgerFactsForAccess(access, migratedHouseholdId, mode, reason));
}

function mergeClaimAndProbe(
  claim: IdentityClaim,
  probe: SessionProbe,
  households: HouseholdRead,
): AccessCore {
  if (probe.kind === "no_session") {
    return claim.kind === "held"
      ? { kind: "session_revoked", lastKnown: claim.user }
      : { kind: "anonymous" };
  }
  if (probe.kind === "unreachable") {
    return claim.kind === "held" ? signedInUnavailable(claim.user) : { kind: "anonymous" };
  }
  return signedInFromSession(probe.user, households);
}

function signedInFromSession(user: Identity, households: HouseholdRead): AccessCore {
  if (households.kind === "pending") return { kind: "resolving" };
  if (households.kind === "failed") return signedInUnavailable(user);
  const active = pickActiveHousehold(households.memberships);
  return {
    kind: "signed_in",
    user,
    household: active ?? { kind: "none" },
    memberships: households.memberships,
  };
}

function signedInUnavailable(user: Identity): AccessCore {
  return {
    kind: "signed_in",
    user,
    household: { kind: "unavailable" },
    memberships: [],
  };
}

function sameIdentity(left: Identity, right: Identity): boolean {
  return (
    left.userId === right.userId &&
    left.email === right.email &&
    left.displayName === right.displayName
  );
}

function newerMembership(left: MembershipSummary, right: MembershipSummary): MembershipSummary {
  return right.createdAt > left.createdAt ? right : left;
}

function ledgerFactsForAccess(
  access: AccessCore,
  migratedHouseholdId: string | null,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): LedgerSourceFacts {
  if (access.kind === "resolving" || access.kind === "anonymous") {
    return localFacts(migratedHouseholdId);
  }
  if (access.kind === "session_revoked") {
    return revokedFacts(access.lastKnown.userId, migratedHouseholdId);
  }
  return signedInFacts(access, migratedHouseholdId, mode, reason);
}

function localFacts(migratedHouseholdId: string | null): LedgerSourceFacts {
  return {
    authenticatedUserId: null,
    activeHouseholdId: null,
    migratedHouseholdId,
    offlineReason: null,
  };
}

function revokedFacts(userId: string, migratedHouseholdId: string | null): LedgerSourceFacts {
  return {
    authenticatedUserId: userId,
    activeHouseholdId: migratedHouseholdId,
    migratedHouseholdId,
    offlineReason: "Signed out remotely. Your ledger is safe on this device.",
  };
}

function signedInFacts(
  access: Extract<AccessCore, { kind: "signed_in" }>,
  migratedHouseholdId: string | null,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): LedgerSourceFacts {
  return {
    authenticatedUserId: access.user.userId,
    activeHouseholdId: activeHouseholdIdForSignedIn(access, migratedHouseholdId),
    migratedHouseholdId,
    offlineReason: offlineReasonForSignedIn(access, mode, reason),
  };
}

function activeHouseholdIdForSignedIn(
  access: Extract<AccessCore, { kind: "signed_in" }>,
  migratedHouseholdId: string | null,
): string | null {
  if (access.household.kind === "active") return access.household.householdId;
  if (access.household.kind === "unavailable") return migratedHouseholdId;
  return null;
}

function offlineReasonForSignedIn(
  access: Extract<AccessCore, { kind: "signed_in" }>,
  mode: SyncMode,
  reason: LocalOnlyReason | null,
): string | null {
  if (access.household.kind === "unavailable") {
    return "Household sync is temporarily unavailable.";
  }
  if (mode === "local_only" && reason === "kill_switch") {
    return "Sync is temporarily unavailable.";
  }
  if (mode === "local_only") return "Delta polling is unavailable.";
  return null;
}
