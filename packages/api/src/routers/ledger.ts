import { and, asc, desc, eq, lt } from "drizzle-orm";
import { createDb } from "@trove/db";
import { z } from "zod";

import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";

import type { HouseholdCaller } from "../lib/require-member";
import { requireHouseholdMember } from "../lib/require-member";
import { requireUserId } from "../lib/require-user";
import { protectedProcedure } from "../index";

const householdInput = z.object({
  householdId: z.string().min(1),
});

const transactionsInput = householdInput.extend({
  /** Page size; the response reports `hasMore` when truncated. */
  limit: z.number().int().min(1).max(200).default(100),
  /**
   * Cursor: continue strictly after this ("YYYY-MM-DD") ledger date.
   * Keyset pagination on (date DESC) — stable under inserts between pages.
   */
  beforeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

async function listAccounts(caller: HouseholdCaller) {
  await requireHouseholdMember(createDb(), caller.userId, caller.householdId);
  return createDb()
    .select()
    .from(ledgerAccount)
    .where(eq(ledgerAccount.householdId, caller.householdId))
    .orderBy(asc(ledgerAccount.sortOrder), asc(ledgerAccount.name));
}

async function listCategories(caller: HouseholdCaller) {
  await requireHouseholdMember(createDb(), caller.userId, caller.householdId);
  return createDb()
    .select()
    .from(category)
    .where(eq(category.householdId, caller.householdId))
    .orderBy(asc(category.sortOrder), asc(category.name));
}

interface TransactionPage {
  readonly transactions: readonly (typeof transaction.$inferSelect)[];
  readonly hasMore: boolean;
}

async function listTransactions(
  caller: HouseholdCaller,
  limit: number,
  beforeDate?: string,
): Promise<TransactionPage> {
  await requireHouseholdMember(createDb(), caller.userId, caller.householdId);
  const rows = await createDb()
    .select()
    .from(transaction)
    .where(
      and(
        eq(transaction.householdId, caller.householdId),
        ...(beforeDate ? [lt(transaction.date, beforeDate)] : []),
      ),
    )
    .orderBy(desc(transaction.date), desc(transaction.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  return { transactions: rows.slice(0, limit), hasMore };
}

/**
 * Read surface for the household ledger. Any member role — including viewer
 * — may read; every write goes through `commands.apply`, whose capability
 * map keeps viewers out. D1 has no RLS: this membership gate plus the
 * household-scoped WHERE clauses ARE the tenancy boundary.
 */
export const ledgerRouter = {
  accounts: {
    list: protectedProcedure.input(householdInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return listAccounts({ userId, householdId: input.householdId });
    }),
  },

  categories: {
    list: protectedProcedure.input(householdInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return listCategories({ userId, householdId: input.householdId });
    }),
  },

  transactions: {
    /** Newest-first page of ledger transactions with keyset cursor. */
    list: protectedProcedure.input(transactionsInput).handler(({ context, input }) => {
      const userId = requireUserId(context);
      return listTransactions(
        { userId, householdId: input.householdId },
        input.limit,
        input.beforeDate,
      );
    }),
  },
};
