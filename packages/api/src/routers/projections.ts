import { createDb } from "@trove/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { getProjections } from "../lib/budget/projections";
import { createHouseholdDeps } from "../lib/households/deps";
import { ledgerReadFields } from "../lib/ledger-read-input";
import { requireFreshLedgerAccess, resolveReadLedgerId } from "../lib/require-member";
import { requireUserId } from "../lib/require-user";

const periodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Budget Periods are "YYYY-MM" calendar months.');

/**
 * Read surface for seq-stamped Period projections (#92). Any authorized
 * reader may read (Household viewer and Personal Ledger owner included);
 * the cache is transparent to callers — a stamp lag behind the ledger's
 * sync seq simply rebuilds on this read.
 */
export const projectionsRouter = {
  get: protectedProcedure
    .input(
      ledgerReadFields
        .extend({
          /** ISO 4217 currency of the Budget Workspace to project. */
          currency: z.string().regex(/^[A-Z]{3}$/, "Use a three-letter ISO currency code."),
          startPeriod: periodSchema,
          endPeriod: periodSchema,
        })
        .refine((input) => input.scope !== undefined || input.householdId !== undefined, {
          message: "Name the ledger this read belongs to: a personal or organization scope.",
          path: ["scope"],
        }),
    )
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      if (input.endPeriod < input.startPeriod) {
        throw new ORPCError("BAD_REQUEST", {
          message: "endPeriod must not precede startPeriod.",
        });
      }
      const db = createDb();
      const ledgerId = resolveReadLedgerId(userId, input);
      await requireFreshLedgerAccess(createHouseholdDeps(db), userId, ledgerId);
      return getProjections(
        db,
        { userId, ledgerId },
        {
          currency: input.currency,
          startPeriod: input.startPeriod,
          endPeriod: input.endPeriod,
        },
      );
    }),
};
