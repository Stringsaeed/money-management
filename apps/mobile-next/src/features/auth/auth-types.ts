export type AuthStatus = "loading" | "signed_out" | "guest" | "signed_in";

export interface SignedInPrincipal {
  readonly kind: "user";
  readonly userId: string;
  readonly workosUserId: string;
  readonly email: string;
  readonly name: string;
}

export interface GuestPrincipal {
  readonly kind: "guest";
  readonly guestSessionId: string;
}

export type AuthPrincipal = SignedInPrincipal | GuestPrincipal;

export type AuthActionResult =
  | { readonly kind: "signed_in"; readonly principal: SignedInPrincipal }
  | { readonly kind: "guest"; readonly principal: GuestPrincipal }
  | { readonly kind: "cancelled" }
  | { readonly kind: "failed"; readonly message: string };

export interface SessionController {
  readonly status: AuthStatus;
  readonly principal: AuthPrincipal | null;
  readonly error: string | null;
  readonly signIn: () => Promise<AuthActionResult>;
  readonly continueAsGuest: () => Promise<AuthActionResult>;
  readonly saveGuestToAccount: () => Promise<AuthActionResult>;
  readonly claimGuest: () => Promise<{ readonly status: "claimed" | "already_claimed" }>;
  readonly signOut: () => Promise<void>;
}
