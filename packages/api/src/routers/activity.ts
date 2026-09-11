import { createDb } from "@trove/db";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { DEFAULT_ACTIVITY_LIMIT, MAX_ACTIVITY_LIMIT, getActivity } from "../lib/activity/list";
import { createHouseholdDeps } from "../lib/households/deps";
import { requireFreshHouseholdMember } from "../lib/require-member";
import { requireUserId } from "../lib/require-user";

/** "YYYY-MM-DD" date-only string, as produced by client date pickers. */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Inclusive day bounds: `from` at its midnight, `to` at its last millisecond. */
const dayStart = (date: string): Date => new Date(`${date}T00:00:00.000Z`);
const dayEnd = (date: string): Date => new Date(`${date}T23:59:59.999Z`);

export const activityRouter = {
  /**
   * Paginated household activity history (#95): committed changes with user
   * attribution, timestamps, and effects decoded into action summaries.
   * Offset pagination — the change log is append-only per household, so a
   * stable offset is safe on D1.
   */
  list: protectedProcedure
    .input(
      z.object({
        householdId: z.string().min(1),
        limit: z.number().int().min(1).max(MAX_ACTIVITY_LIMIT).default(DEFAULT_ACTIVITY_LIMIT),
        offset: z.number().int().min(0).default(0),
        /** Restrict the timeline to one member's changes. */
        userId: z.string().min(1).optional(),
        /** Inclusive date-range bounds ("YYYY-MM-DD", UTC). */
        from: dateString.optional(),
        to: dateString.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const callerId = requireUserId(context);
      const db = createDb();
      await requireFreshHouseholdMember(createHouseholdDeps(db), callerId, input.householdId);
      return getActivity({
        db,
        userId: callerId,
        householdId: input.householdId,
        limit: input.limit,
        offset: input.offset,
        filterUserId: input.userId,
        ...(input.from && { from: dayStart(input.from) }),
        ...(input.to && { to: dayEnd(input.to) }),
      });
    }),
};
