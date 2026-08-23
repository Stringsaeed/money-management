import { createDb } from "@trove/db";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { listEnvelopes } from "../lib/budget/envelopes";
import {
  getCategoryMappingTimeline,
  getFundingMembershipTimeline,
  getRolloverSettingTimeline,
} from "../lib/budget/period-effective";
import { requireUserId } from "../lib/require-user";

const householdInput = z.object({
  householdId: z.string().min(1),
});

const fundingMembershipInput = householdInput.extend({
  /** Optional filter to one workspace's currency. */
  currency: z.string().min(1).optional(),
});

/**
 * Read surface for the budget domain. Any member role — including viewer —
 * may read; every write goes through `commands.apply`, whose capability map
 * keeps viewers out.
 */
export const budgetRouter = {
  envelopes: {
    list: protectedProcedure.input(householdInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return listEnvelopes(createDb(), { userId, householdId: input.householdId });
    }),
  },

  mappings: {
    /** Category→Envelope attribution with derived effective spans. */
    list: protectedProcedure.input(householdInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return getCategoryMappingTimeline(createDb(), {
        userId,
        householdId: input.householdId,
      });
    }),
  },

  fundingMemberships: {
    /** Funding-pool membership with derived effective spans. */
    list: protectedProcedure.input(fundingMembershipInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return getFundingMembershipTimeline(
        createDb(),
        { userId, householdId: input.householdId },
        input.currency,
      );
    }),
  },

  rolloverSettings: {
    /** Per-envelope rollover settings with derived effective spans. */
    list: protectedProcedure.input(householdInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return getRolloverSettingTimeline(createDb(), {
        userId,
        householdId: input.householdId,
      });
    }),
  },
};
