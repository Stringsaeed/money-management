import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { v2Assignment, v2Envelope } from "@trove/db/schema/v2-budget";
import { v2Identity } from "@trove/db/schema/v2-identity";

import { findBudget } from "./budget";
import type { V2BudgetActivity } from "./contracts";
import { iso, safeMinor, V2ApiError, type V2LedgerContext } from "./shared";

export const BUDGET_ACTIVITY_DEFAULT_LIMIT = 20;
export const BUDGET_ACTIVITY_MAX_LIMIT = 50;

/**
 * Recent money moves for "who" lines (#375 H3), newest first. Transactions keep
 * their own authorship; this lists only the append-only assignments.
 */
export async function listBudgetActivity(
  context: V2LedgerContext,
  limit = BUDGET_ACTIVITY_DEFAULT_LIMIT,
): Promise<V2BudgetActivity> {
  if (!Number.isInteger(limit) || limit < 1 || limit > BUDGET_ACTIVITY_MAX_LIMIT) {
    throw new V2ApiError(
      400,
      "invalid_limit",
      `limit must be between 1 and ${BUDGET_ACTIVITY_MAX_LIMIT}.`,
    );
  }
  const budget = await findBudget(context.db, context.ledgerId);
  if (!budget) return { items: [] };

  const fromEnvelope = alias(v2Envelope, "from_envelope");
  const toEnvelope = alias(v2Envelope, "to_envelope");
  const rows = await context.db
    .select({
      id: v2Assignment.id,
      periodStart: v2Assignment.periodStart,
      fromEnvelopeId: v2Assignment.fromEnvelopeId,
      fromName: fromEnvelope.name,
      toEnvelopeId: v2Assignment.toEnvelopeId,
      toName: toEnvelope.name,
      amountMinor: v2Assignment.amountMinor,
      reason: v2Assignment.reason,
      createdBy: v2Assignment.createdBy,
      createdByName: v2Identity.name,
      createdAt: v2Assignment.createdAt,
    })
    .from(v2Assignment)
    .leftJoin(fromEnvelope, eq(fromEnvelope.id, v2Assignment.fromEnvelopeId))
    .leftJoin(toEnvelope, eq(toEnvelope.id, v2Assignment.toEnvelopeId))
    .leftJoin(v2Identity, eq(v2Identity.id, v2Assignment.createdBy))
    .where(eq(v2Assignment.budgetId, budget.id))
    .orderBy(desc(v2Assignment.createdAt), desc(v2Assignment.id))
    .limit(limit);

  return {
    items: rows.map((row) => ({
      ...row,
      amountMinor: safeMinor(row.amountMinor, "Assignment amount"),
      createdAt: iso(row.createdAt),
    })),
  };
}
