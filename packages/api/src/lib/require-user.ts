import { ORPCError } from "@orpc/server";

import type { Context } from "../context";

/**
 * Extracts the authenticated user id inside a handler. `protectedProcedure`
 * already gates the procedure; this is the typed narrowing step for handlers
 * that need the id itself.
 */
export function requireUserId(context: Context): string {
  const userId = context.session?.user?.id;
  if (!userId) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in to continue." });
  }
  return userId;
}
