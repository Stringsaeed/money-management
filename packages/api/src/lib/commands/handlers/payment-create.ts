import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { routeCardPayment } from "@trove/domain/card-waterfall";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";

import { getBudgetPoolFacts } from "../../budget/funding-pool";
import {
  cardPaymentReserveSql,
  getReserveFacts,
  periodLastDate,
  unfundedCardSpendingSql,
} from "../../budget/reserve";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";

import { privateAccountAccessRejection } from "./private-account";
import { issuesFromZod } from "./shared";

/**
 * card_payment.record (#91, ADR-0011): a Card Payment is a same-currency
 * transfer from a Funding Account to the card Account. The waterfall consumes
 * the Card Payment Reserve first, then funded Opening Card Debt (#91 data),
 * then Unassigned Money against unfunded spending; a payment beyond total
 * liability becomes Card Credit (ADR-0014) and returns to Unassigned Money.
 *
 * Precondition: reserve sufficiency is re-validated inside the atomic batch
 * via the identical SQL fragment the plan read — the #90 lock-replacement
 * pattern. An interleaved writer draining the reserve aborts this batch.
 */
const paymentPayloadSchema = z.object({
  transactionId: z.string().min(1).optional(),
  /** Credit-card account receiving the payment. */
  cardAccountId: z.string().min(1),
  /** Funding account the cash leaves. */
  fundingAccountId: z.string().min(1),
  currency: z.string().min(3).max(3),
  amountMinor: z.number().int().positive(),
  budgetPeriod: z.string().regex(/^\d{4}-\d{2}$/, "budgetPeriod must be YYYY-MM"),
  /** Ledger date of the payment; defaults to the period's last day. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

type PaymentPayload = z.infer<typeof paymentPayloadSchema>;

async function loadAccount(ctx: PlanContext, id: string) {
  const rows = await ctx.db
    .select()
    .from(ledgerAccount)
    .where(and(eq(ledgerAccount.householdId, ctx.householdId), eq(ledgerAccount.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export const paymentCreateHandler = {
  parsePayload(payload: unknown) {
    const result = paymentPayloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
    const input = payload as PaymentPayload;
    const transactionId = input.transactionId ?? crypto.randomUUID();

    const [card, funding] = [
      await loadAccount(ctx, input.cardAccountId),
      await loadAccount(ctx, input.fundingAccountId),
    ];
    if (!card || card.type !== "card") {
      return {
        kind: "missing_entity",
        entityType: "card_account",
        entityId: input.cardAccountId,
      };
    }
    if (!funding) {
      return { kind: "missing_entity", entityType: "account", entityId: input.fundingAccountId };
    }
    const cardAccessRejection = privateAccountAccessRejection(ctx, card);
    if (cardAccessRejection) {
      return cardAccessRejection;
    }
    const fundingAccessRejection = privateAccountAccessRejection(ctx, funding);
    if (fundingAccessRejection) {
      return fundingAccessRejection;
    }
    if (card.currency !== input.currency || funding.currency !== input.currency) {
      return {
        kind: "invalid_intent",
        issues: [
          { field: "currency", message: "A Card Payment must stay within one currency workspace." },
        ],
      };
    }

    const facts = await getBudgetPoolFacts(
      ctx.db,
      ctx.householdId,
      input.currency,
      input.budgetPeriod,
    );
    const reserve = await getReserveFacts(
      ctx.db,
      ctx.householdId,
      input.currency,
      input.budgetPeriod,
    );

    // Funded Opening Card Debt arrives with dedicated reserve assignments;
    // until such rows exist the waterfall's second stage consumes nothing.
    const fundedOpeningDebtMinor = 0;

    const unfundedRows = await ctx.db.all(
      sql`SELECT ${unfundedCardSpendingSql(ctx.householdId, input.currency, input.budgetPeriod)} AS unfunded`,
    );
    const unfundedCardSpendingMinor = Number(
      (unfundedRows[0] as Record<string, number> | undefined)?.unfunded ?? 0,
    );

    const routing = routeCardPayment({
      amountMinor: input.amountMinor,
      reserveMinor: reserve.reserveMinor,
      fundedOpeningDebtMinor,
      unassignedMinor: facts.unassignedMinor,
      unfundedCardSpendingMinor,
    });

    return {
      effects: ["ledger", "balances", "projections", "summaries"],
      applied: {
        transactionId,
        cardAccountId: input.cardAccountId,
        fundingAccountId: input.fundingAccountId,
        amountMinor: input.amountMinor,
        routing,
        reserveAfter: reserve.reserveMinor - routing.reserveConsumedMinor,
        unassignedAfter:
          facts.unassignedMinor - routing.unassignedConsumedMinor + routing.cardCreditMinor,
      },
      guards: [
        // Reserve sufficiency re-check: aborts when an interleaved writer
        // drained the reserve between planning and commit.
        sql`(SELECT ${cardPaymentReserveSql(ctx.householdId, input.currency, input.budgetPeriod)}) >= ${routing.reserveConsumedMinor}`,
      ],
      statements: [
        ctx.db
          .insert(transaction)
          .values({
            householdId: ctx.householdId,
            id: transactionId,
            type: "transfer",
            amountMinor: input.amountMinor,
            currency: input.currency,
            date: input.date ?? periodLastDate(input.budgetPeriod),
            accountId: input.fundingAccountId,
            toAccountId: input.cardAccountId,
            description: "Card payment",
            createdBy: ctx.actorUserId,
            updatedBy: ctx.actorUserId,
          })
          .onConflictDoNothing() as unknown as BatchStatement,
      ],
    };
  },
};
