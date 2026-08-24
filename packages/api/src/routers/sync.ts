import { createDb } from "@trove/db";
import { env } from "@trove/env/server";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { requireUserId } from "../lib/require-user";
import { DEFAULT_DELTA_LIMIT, MAX_DELTA_LIMIT, getDelta } from "../lib/sync/delta";
import { instrumentSyncPull } from "../lib/observability/metrics";
import { requestMetrics } from "../lib/observability/runtime";
import { isKillSwitchEngaged } from "../lib/observability/kill-switch";

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
      return instrumentSyncPull(requestMetrics(), () =>
        getDelta({
          db,
          userId,
          householdId: input.householdId,
          since: input.since,
          limit: input.limit,
        }),
      );
    }),
  /**
   * Client-facing kill-switch probe (#99): polled once on app startup so the
   * app can gate sync before draining the outbox.
   */
  status: protectedProcedure.handler(() => ({
    killSwitchLocalOnly: isKillSwitchEngaged(env.KILL_SWITCH_LOCAL_ONLY),
  })),
};
