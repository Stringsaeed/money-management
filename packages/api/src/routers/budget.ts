import { createDb } from "@trove/db";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { listEnvelopes } from "../lib/budget/envelopes";
import {
  getCategoryMappingTimeline,
  getFundingMembershipTimeline,
  getRolloverSettingTimeline,
} from "../lib/budget/period-effective";
import { ledgerReadFields, ledgerReadInput } from "../lib/ledger-read-input";
import { requireUserId } from "../lib/require-user";
import { resolveReadLedgerId } from "../lib/require-member";

const fundingMembershipInput = ledgerReadFields
  .extend({
    /** Optional filter to one workspace's currency. */
    currency: z.string().min(1).optional(),
  })
  .refine((input) => input.scope !== undefined || input.householdId !== undefined, {
    message: "Name the ledger this read belongs to: a personal or organization scope.",
    path: ["scope"],
  });

/**
 * Read surface for the budget domain. Any authorized reader — including a
 * Household viewer and a Personal Ledger owner — may read; every write goes
 * through `commands.apply`, whose capability map keeps viewers out.
 */
export const budgetRouter = {
  envelopes: {
    list: protectedProcedure.input(ledgerReadInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return listEnvelopes(createDb(), {
        userId,
        ledgerId: resolveReadLedgerId(userId, input),
      });
    }),
  },

  mappings: {
    /** Category→Envelope attribution with derived effective spans. */
    list: protectedProcedure.input(ledgerReadInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return getCategoryMappingTimeline(createDb(), {
        userId,
        ledgerId: resolveReadLedgerId(userId, input),
      });
    }),
  },

  fundingMemberships: {
    /** Funding-pool membership with derived effective spans. */
    list: protectedProcedure.input(fundingMembershipInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return getFundingMembershipTimeline(
        createDb(),
        { userId, ledgerId: resolveReadLedgerId(userId, input) },
        input.currency,
      );
    }),
  },

  rolloverSettings: {
    /** Per-envelope rollover settings with derived effective spans. */
    list: protectedProcedure.input(ledgerReadInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return getRolloverSettingTimeline(createDb(), {
        userId,
        ledgerId: resolveReadLedgerId(userId, input),
      });
    }),
  },
};
