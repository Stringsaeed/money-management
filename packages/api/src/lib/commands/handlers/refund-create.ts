import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";

import { ledgerAccount, transaction } from "@trove/db/schema/ledger";
import { getBudgetPoolFacts } from "../../budget/funding-pool";
import { queryRows } from "../../sql-rows";

import { privateAccountAccessRejection } from "./private-account";
import { issuesFromZod, scopeColumns } from "./shared";

/**
 * refund.link (#91, ADR-0008): a full or partial return of Money linked to
 * its original expense Transaction.
 *
 * - Cumulative cap: all Refunds of one original together cannot exceed the
 *   original's amount. Enforced by a guard that re-reads the refund sum
 *   INSIDE the atomic batch — two interleaved refunds of the same expense
 *   cannot both pass (triage requirement).
 * - Period attribution: the Refund owns the ORIGINAL transaction's Budget
 *   Period, not the current one.
 * - Reserve adjustment: netting card-account spending against refunds inside
 *   the reserve computation adjusts the Card Payment Reserve automatically.
 */

const refundPayloadSchema = z.object({
  transactionId: z.string().min(1).optional(),
  /** Original expense transaction being returned. */
  originalTransactionId: z.string().min(1),
  /** Account receiving the refunded Money (the original card, or any same-currency Funding Account). */
  depositAccountId: z.string().min(1),
  currency: z.string().min(3).max(3),
  amountMinor: z.number().int().positive(),
  /** Ledger date of the refund transaction ("YYYY-MM-DD"). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type RefundPayload = z.infer<typeof refundPayloadSchema>;

export const refundCreateHandler = {
  supportsPersonalScope: true as const,

  parsePayload(payload: unknown) {
    const result = refundPayloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(
    ctx: PlanContext,
    { payload }: PlanRequest,
  ): Promise<CommandPlan | PlanRejection> {
    const input = payload as RefundPayload;

    // The original must exist in this ledger, be an expense, and share the
    // currency — cross-ledger linkage is impossible by scoping alone.
    const originalRows = await ctx.db
      .select()
      .from(transaction)
      .where(
        and(eq(transaction.ledgerId, ctx.ledgerId), eq(transaction.id, input.originalTransactionId)),
      )
      .limit(1);
    const original = originalRows[0];
    if (!original) {
      return {
        kind: "missing_entity",
        entityType: "transaction",
        entityId: input.originalTransactionId,
      };
    }
    if (original.type !== "expense") {
      return {
        kind: "invalid_intent",
        issues: [{ field: "originalTransactionId", message: "Only expenses can be refunded." }],
      };
    }
    if (original.currency !== input.currency) {
      return {
        kind: "invalid_intent",
        issues: [
          { field: "currency", message: "A Refund must be same-currency with its original." },
        ],
      };
    }

    const originalAccountRows = await ctx.db
      .select()
      .from(ledgerAccount)
      .where(
        and(eq(ledgerAccount.ledgerId, ctx.ledgerId), eq(ledgerAccount.id, original.accountId)),
      )
      .limit(1);
    const originalAccount = originalAccountRows[0];
    if (!originalAccount) {
      return {
        kind: "missing_entity",
        entityType: "account",
        entityId: original.accountId,
      };
    }
    const originalAccountAccessRejection = privateAccountAccessRejection(ctx, originalAccount);
    if (originalAccountAccessRejection) {
      return originalAccountAccessRejection;
    }

    // Deposit account must exist here; card refunds must return to the
    // original card (ADR-0008), cash refunds may use any Funding Account.
    const depositRows = await ctx.db
      .select()
      .from(ledgerAccount)
      .where(
        and(eq(ledgerAccount.ledgerId, ctx.ledgerId), eq(ledgerAccount.id, input.depositAccountId)),
      )
      .limit(1);
    const deposit = depositRows[0];
    if (!deposit) {
      return {
        kind: "missing_entity",
        entityType: "account",
        entityId: input.depositAccountId,
      };
    }
    const depositAccessRejection = privateAccountAccessRejection(ctx, deposit);
    if (depositAccessRejection) {
      return depositAccessRejection;
    }
    // Card Refunds return to the original card; other accounts act as
    // same-currency Funding destinations.
    if (deposit.type === "card" && deposit.id !== original.accountId) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "depositAccountId",
            message: "A card Refund must return to the original card.",
          },
        ],
      };
    }

    // ADR-0008 / CONTEXT.md: a Refund affects its OWN Budget Period (when
    // the Money returned), not the current one and not retroactively the
    // original's. Envelope restoration follows from its ledger date via the
    // category-mapping timeline; reserve adjustment is automatic netting.
    const budgetPeriod = input.date.slice(0, 7);

    // Cumulative cap at plan time: existing linked refunds plus this one may
    // not exceed the original expense. The same sum is re-read inside the
    // batch as a guard, so an interleaved refund still cannot slip through.
    const refundedRows = await queryRows<Record<string, number>>(
      ctx.db,
      sql`SELECT COALESCE(SUM(r.amount_minor), 0) AS total FROM refund_links r
          WHERE r.ledger_id = ${ctx.ledgerId}
            AND r.original_transaction_id = ${input.originalTransactionId}`,
    );
    const alreadyRefundedMinor = Number(
      (refundedRows[0] as Record<string, number> | undefined)?.total ?? 0,
    );
    if (alreadyRefundedMinor + input.amountMinor > original.amountMinor) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "amountMinor",
            message: `Only ${original.amountMinor - alreadyRefundedMinor} minor units of the original expense remain refundable.`,
          },
        ],
      };
    }

    const facts = await getBudgetPoolFacts(ctx.db, ctx.ledgerId, input.currency, budgetPeriod);

    const refundTransactionId = input.transactionId ?? crypto.randomUUID();
    const { refundLink } = await import("@trove/db/schema/budget");

    // Cumulative cap, re-read inside the batch: existing linked refunds plus
    // this one may not exceed the original expense. An interleaved refund
    // committing first makes this assertion abort our batch.
    const guards = [
      sql`(SELECT COALESCE(SUM(r.amount_minor), 0) FROM refund_links r
           WHERE r.ledger_id = ${ctx.ledgerId}
             AND r.original_transaction_id = ${input.originalTransactionId})
         + ${input.amountMinor} <= ${original.amountMinor}`,
    ];

    const statements: BatchStatement[] = [
      // The ledger row: income into the deposit account, categorized like
      // the original so envelope restoration follows the mapping timeline.
      ctx.db
        .insert(transaction)
        .values({
          ledgerId: ctx.ledgerId,
          householdId: ctx.householdId,
          id: refundTransactionId,
          type: "income",
          amountMinor: input.amountMinor,
          currency: input.currency,
          date: input.date,
          accountId: input.depositAccountId,
          categoryId: original.categoryId,
          description: `Refund of ${input.originalTransactionId}`,
          createdBy: ctx.actorUserId,
          updatedBy: ctx.actorUserId,
        })
        .onConflictDoNothing() as unknown as BatchStatement,
      // Linkage row — written in the SAME batch so the cap is race-free.
      ctx.db
        .insert(refundLink)
        .values({
          ...scopeColumns(ctx),
          id: crypto.randomUUID(),
          originalTransactionId: input.originalTransactionId,
          refundTransactionId,
          currency: input.currency,
          amountMinor: input.amountMinor,
          createdBy: ctx.actorUserId,
          updatedBy: ctx.actorUserId,
        })
        .onConflictDoNothing() as unknown as BatchStatement,
    ];

    return {
      effects: ["ledger", "balances", "projections", "summaries"],
      applied: {
        transactionId: refundTransactionId,
        originalTransactionId: input.originalTransactionId,
        depositAccountId: input.depositAccountId,
        amountMinor: input.amountMinor,
        budgetPeriod,
        unassignedAfter: facts.unassignedMinor + input.amountMinor,
      },
      guards,
      statements,
    };
  },
};
