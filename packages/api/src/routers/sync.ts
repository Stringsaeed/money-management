import { createDb } from "@trove/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { DEFAULT_DELTA_LIMIT, MAX_DELTA_LIMIT, getDelta } from "../lib/sync/delta";

function requireUserId(context: { session?: { user?: { id?: string } | null } | null }): string {
  const userId = context.session?.user?.id;
  if (!userId) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in to sync household changes." });
  }
  return userId;
}

export const syncRouter = {
  /**
   * Delta pull: everything this member's household committed after their
   * watermark. Polling-first by design — any future push path (#93) would
   * deliver the same `{seq, effects}` notifications; pulling produces
   * identical results.
   */
  getDelta: protectedProcedure
    .input(
      z.object({
        householdId: z.string().min(1),
        since: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(MAX_DELTA_LIMIT).default(DEFAULT_DELTA_LIMIT),
      }),
    )
    .handler(({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      return getDelta({
        db,
        userId,
        householdId: input.householdId,
        since: input.since,
        limit: input.limit,
      });
    }),
};
