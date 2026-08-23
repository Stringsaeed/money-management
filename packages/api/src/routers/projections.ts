import { createDb } from "@trove/db";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { getProjections } from "../lib/budget/projections";
import { requireUserId } from "../lib/require-user";

const periodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Budget Periods are "YYYY-MM" calendar months.');

/**
 * Read surface for seq-stamped Period projections (#92). Any member role may
 * read (viewer included); the cache is transparent to callers — a stamp lag
 * behind the household's sync seq simply rebuilds on this read.
 */
export const projectionsRouter = {
  get: protectedProcedure
    .input(
      z.object({
        householdId: z.string().min(1),
        /** ISO 4217 currency of the Budget Workspace to project. */
        currency: z.string().regex(/^[A-Z]{3}$/, "Use a three-letter ISO currency code."),
        startPeriod: periodSchema,
        endPeriod: periodSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      if (input.endPeriod < input.startPeriod) {
        throw new Error("endPeriod must not precede startPeriod.");
      }
      return getProjections(
        createDb(),
        { userId, householdId: input.householdId },
        {
          currency: input.currency,
          startPeriod: input.startPeriod,
          endPeriod: input.endPeriod,
        },
      );
    }),
};
