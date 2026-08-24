import { and, eq } from "drizzle-orm";

import { membership } from "@trove/db/schema/household";

import type { CommandDatabase } from "../commands/types";
import type { PushNamespace } from "./publisher";

/** The push channel lives at `/api/push/household/:householdId`. */
export const householdPushPath = (householdId: string): string =>
  `/api/push/household/${householdId}`;

export interface PushUpgradeSession {
  readonly user: { readonly id: string };
}

/**
 * Dependencies of the WebSocket upgrade, injected so the auth/db/namespace
 * stack stays swappable in tests.
 */
export interface PushUpgradeDeps {
  /** Matches better-auth's `api.getSession({ headers })` shape. */
  getSession(args: { headers: Headers }): Promise<PushUpgradeSession | null>;
  db: CommandDatabase;
  namespace: PushNamespace | undefined;
}

/**
 * Gates a push subscription on session + live household membership (the same
 * tenancy check as every scoped read — D1 has no RLS backstop), then forwards
 * the request to the household's Durable Object for the actual upgrade.
 */
export async function handleHouseholdPushUpgrade(
  deps: PushUpgradeDeps,
  request: Request,
  householdId: string,
): Promise<Response> {
  const session = await deps.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await deps.db
    .select({ id: membership.id })
    .from(membership)
    .where(and(eq(membership.userId, session.user.id), eq(membership.householdId, householdId)))
    .limit(1)
    .catch(() => []);
  if (!rows[0]) {
    // Non-members and read failures look identical: no subscription.
    return new Response("Forbidden", { status: 403 });
  }

  if (!deps.namespace) {
    // Push is best-effort infrastructure; absence is a clean "unavailable",
    // not an error clients need to surface (#93 fallback contract).
    return new Response("Push unavailable", { status: 503 });
  }

  const stub = deps.namespace.get(deps.namespace.idFromName(householdId));
  return stub.fetch(request);
}
