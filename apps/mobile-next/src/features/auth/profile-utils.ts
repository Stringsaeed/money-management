import type { AuthPrincipal, AuthStatus } from "./auth-types";

export const profileIdentity = (status: AuthStatus, principal: AuthPrincipal | null) => {
  const user = principal?.kind === "user" ? principal : null;
  return {
    user,
    isGuest: status === "guest" && principal?.kind === "guest",
    description: user
      ? `Signed in as ${user.email || user.name}.`
      : "Your guest ledger is stored in a private guest session.",
  };
};
