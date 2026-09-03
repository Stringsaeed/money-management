import { authClient } from "@/lib/auth-client";

import { type ClientFailure, isUnreachableFailure } from "./client-error";
import { identityFromUser } from "./identity";
import type { SessionProbe } from "./types";

export function useSessionProbe(): SessionProbe | null {
  return mapSessionSnapshot(authClient.useSession());
}

export async function probeSession(): Promise<SessionProbe> {
  try {
    return mapSessionSnapshot(await authClient.getSession()) ?? { kind: "no_session" };
  } catch (error) {
    return isUnreachableFailure(error instanceof Error ? error : { message: "failed" })
      ? { kind: "unreachable" }
      : { kind: "no_session" };
  }
}

export async function endRemoteSession(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    // Offline sign-out still clears the local claim in the provider.
  }
}

export function getAuthCookie(): string {
  return authClient.getCookie();
}

export function mapSessionSnapshot(input: {
  readonly data?: { readonly user?: SessionUserLike | null } | null;
  readonly error?: ClientFailure | Error | null;
  readonly isPending?: boolean;
}): SessionProbe | null {
  const user = input.data?.user;
  if (user?.id && user.email) {
    return { kind: "session", user: identityFromUser(user) };
  }
  if (input.isPending) return null;
  if (isUnreachableFailure(input.error)) return { kind: "unreachable" };
  return { kind: "no_session" };
}

interface SessionUserLike {
  readonly id: string;
  readonly email: string;
  readonly name?: string | null;
}
