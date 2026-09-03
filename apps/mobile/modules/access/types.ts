export interface Identity {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
}

export type IdentityClaim =
  | { readonly kind: "none" }
  | { readonly kind: "held"; readonly user: Identity; readonly establishedAt: string };

export type SessionProbe =
  | { readonly kind: "session"; readonly user: Identity }
  | { readonly kind: "no_session" }
  | { readonly kind: "unreachable" };

export type HouseholdAccessCore =
  | { readonly kind: "none" }
  | {
      readonly kind: "active";
      readonly householdId: string;
      readonly name: string;
      readonly role: "owner" | "member";
    }
  | { readonly kind: "unavailable" };

export type HouseholdAccess =
  | Exclude<HouseholdAccessCore, { kind: "unavailable" }>
  | { readonly kind: "unavailable"; readonly retry: () => void };

export interface MembershipSummary {
  readonly householdId: string;
  readonly name: string;
  readonly role: "owner" | "member";
  readonly isActive: boolean;
  readonly createdAt: string;
}

export type HouseholdRead =
  | { readonly kind: "pending" }
  | { readonly kind: "loaded"; readonly memberships: readonly MembershipSummary[] }
  | { readonly kind: "failed" };

export type AccessCore =
  | { readonly kind: "resolving" }
  | { readonly kind: "anonymous" }
  | {
      readonly kind: "signed_in";
      readonly user: Identity;
      readonly household: HouseholdAccessCore;
      readonly memberships: readonly MembershipSummary[];
    }
  | { readonly kind: "session_revoked"; readonly lastKnown: Identity };

export type InternalHref = "/(tabs)/settings/household" | "/(tabs)" | "/(tabs)/settings";

export type ReturnTo =
  | { readonly kind: "profile_household" }
  | { readonly kind: "screen"; readonly href: InternalHref };

export type AccessState =
  | { readonly kind: "resolving" }
  | {
      readonly kind: "anonymous";
      readonly beginAuth: (target: ReturnTo) => void;
    }
  | {
      readonly kind: "signed_in";
      readonly user: Identity;
      readonly household: HouseholdAccess;
      readonly memberships: readonly MembershipSummary[];
      readonly setActiveHousehold: (householdId: string) => Promise<void>;
      readonly signOut: () => Promise<void>;
    }
  | {
      readonly kind: "session_revoked";
      readonly lastKnown: Identity;
      readonly reauthenticate: (target: ReturnTo) => void;
      readonly signOut: () => Promise<void>;
    };

export type AuthLinkKind = "magic" | "reset";

export type LinkGrant =
  | { readonly kind: "sign_in_token"; readonly token: string }
  | { readonly kind: "reset_token"; readonly token: string };

export interface ResolveAccessInput {
  readonly claim: IdentityClaim;
  readonly probe: SessionProbe | null;
  readonly households: HouseholdRead;
}
