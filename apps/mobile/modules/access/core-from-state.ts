import type { AccessCore, AccessState } from "./types";

export function coreFromAccess(access: AccessState): AccessCore {
  if (access.kind === "signed_in") {
    return {
      kind: "signed_in",
      user: access.user,
      household:
        access.household.kind === "unavailable" ? { kind: "unavailable" } : access.household,
      memberships: access.memberships,
      selection: access.selection,
    };
  }
  if (access.kind === "session_revoked") {
    return { kind: "session_revoked", lastKnown: access.lastKnown };
  }
  if (access.kind === "anonymous") return { kind: "anonymous" };
  return { kind: "resolving" };
}
