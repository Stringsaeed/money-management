import { createDb } from "@trove/db";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { listEnvelopes } from "../lib/budget/envelopes";
import {
  getCategoryMappingTimeline,
  getFundingMembershipTimeline,
  getRolloverSettingTimeline,
} from "../lib/budget/period-effective";
import { createHouseholdDeps } from "../lib/households/deps";
import { ledgerReadFields, ledgerReadInput } from "../lib/ledger-read-input";
import { requireUserId } from "../lib/require-user";
import { requireFreshLedgerAccess, resolveReadLedgerId } from "../lib/require-member";

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
      const db = createDb();
      const ledgerId = resolveReadLedgerId(userId, input);
      return requireFreshLedgerAccess(createHouseholdDeps(db), userId, ledgerId).then(() =>
        listEnvelopes(db, { userId, ledgerId }),
      );
    }),
  },

  mappings: {
    /** Category→Envelope attribution with derived effective spans. */
    list: protectedProcedure.input(ledgerReadInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const ledgerId = resolveReadLedgerId(userId, input);
      return requireFreshLedgerAccess(createHouseholdDeps(db), userId, ledgerId).then(() =>
        getCategoryMappingTimeline(db, { userId, ledgerId }),
      );
    }),
  },

  fundingMemberships: {
    /** Funding-pool membership with derived effective spans. */
    list: protectedProcedure.input(fundingMembershipInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const ledgerId = resolveReadLedgerId(userId, input);
      return requireFreshLedgerAccess(createHouseholdDeps(db), userId, ledgerId).then(() =>
        getFundingMembershipTimeline(db, { userId, ledgerId }, input.currency),
      );
    }),
  },

  rolloverSettings: {
    /** Per-envelope rollover settings with derived effective spans. */
    list: protectedProcedure.input(ledgerReadInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const ledgerId = resolveReadLedgerId(userId, input);
      return requireFreshLedgerAccess(createHouseholdDeps(db), userId, ledgerId).then(() =>
        getRolloverSettingTimeline(db, { userId, ledgerId }),
      );
    }),
  },
};
