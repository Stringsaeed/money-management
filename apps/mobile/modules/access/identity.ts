import type { Identity } from "./types";

export function identityFromUser(user: {
  readonly id: string;
  readonly email: string;
  readonly name?: string | null;
}): Identity {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.name ?? "",
  };
}

export function sameIdentity(left: Identity, right: Identity): boolean {
  return (
    left.userId === right.userId &&
    left.email === right.email &&
    left.displayName === right.displayName
  );
}
