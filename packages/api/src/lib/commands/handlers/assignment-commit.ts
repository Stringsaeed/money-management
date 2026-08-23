import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { applyAssignmentToAvailability, routeAssignment } from "@trove/domain/assignment-waterfall";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";

import { assignment, envelope } from "@trove/db/schema/budget";
import { getBudgetPoolFacts, unassignedMoneySql } from "../../budget/funding-pool";
import { getEnvelopeAssignedBalance } from "../../budget/envelope-balance";

import { issuesFromZod } from "./shared";

/**
 * assignment.commit (#90): move Money into or out of one Envelope's plan.
 *
 * Three shapes share one command kind:
 * - top-up from Unassigned Money (no source) — consumes Unassigned Money;
 * - move between two envelopes — budget-neutral;
 * - reversal of an earlier assignment (`reversesAssignmentId`, ADR-0007) —
 *   gives the original's Money back; originals are never edited or deleted.
 *
 * Precondition (ADR-0015): a top-up may not consume more Unassigned Money
 * than exists. The caller may send the `unassigned_money_gte` predicate;
 * either way the pipeline embeds the identical SQL computation as a failing
 * CHECK assertion inside the atomic batch — D1 single-writer plus in-batch
 * re-validation is the advisory-lock replacement, so two interleaved commits
 * can never both consume the last Money.
 */

const assignmentCommitPayloadSchema = z.object({
  destinationEnvelopeId: z.string().min(1),
  /** Omit/null for a plain top-up from Unassigned Money. */
  sourceEnvelopeId: z.string().min(1).nullable().default(null),
  currency: z.string().min(3).max(3),
  amountMinor: z.number().int().positive(),
  budgetPeriod: z.string().regex(/^\d{4}-\d{2}$/, "budgetPeriod must be YYYY-MM"),
  reversesAssignmentId: z.string().min(1).nullable().default(null),
});

type AssignmentCommitPayload = z.infer<typeof assignmentCommitPayloadSchema>;

async function loadEnvelope(ctx: PlanContext, id: string) {
  const rows = await ctx.db
    .select()
    .from(envelope)
    .where(and(eq(envelope.householdId, ctx.householdId), eq(envelope.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export const assignmentCommitHandler = {
  supportedPredicates: ["unassigned_money_gte"],

  parsePayload(payload: unknown) {
    const result = assignmentCommitPayloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(
    ctx: PlanContext,
    { payload, preconditions }: PlanRequest,
  ): Promise<CommandPlan | PlanRejection> {
    const input = payload as AssignmentCommitPayload;

    // Destination envelope must exist and share the workspace currency.
    const destination = await loadEnvelope(ctx, input.destinationEnvelopeId);
    if (!destination) {
      return {
        kind: "missing_entity",
        entityType: "envelope",
        entityId: input.destinationEnvelopeId,
      };
    }
    if (destination.currency !== input.currency) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "currency",
            message: `Envelope "${destination.name}" lives in the ${destination.currency} workspace.`,
          },
        ],
      };
    }

    let sourceEnvelopeId: string | null = null;
    let destinationEnvelopeId: string = input.destinationEnvelopeId;
    let amountMinor = input.amountMinor;

    if (input.reversesAssignmentId) {
      // Reversal (ADR-0007): opposite-direction row linked to the original.
      const originalRows = await ctx.db
        .select()
        .from(assignment)
        .where(
          and(
            eq(assignment.householdId, ctx.householdId),
            eq(assignment.id, input.reversesAssignmentId),
          ),
        )
        .limit(1);
      const original = originalRows[0];
      if (!original) {
        return {
          kind: "missing_entity",
          entityType: "assignment",
          entityId: input.reversesAssignmentId,
        };
      }
      const alreadyReversed = await ctx.db
        .select({ id: assignment.id })
        .from(assignment)
        .where(
          and(
            eq(assignment.householdId, ctx.householdId),
            eq(assignment.reversesAssignmentId, input.reversesAssignmentId),
          ),
        )
        .limit(1);
      if (alreadyReversed[0]) {
        return {
          kind: "invalid_intent",
          issues: [
            {
              field: "reversesAssignmentId",
              message: "That assignment has already been reversed.",
            },
          ],
        };
      }
      if (!original.destinationEnvelopeId) {
        return {
          kind: "invalid_intent",
          issues: [
            {
              field: "reversesAssignmentId",
              message: "Only assignments INTO an envelope can be reversed.",
            },
          ],
        };
      }
      if (input.amountMinor !== original.amountMinor || input.currency !== original.currency) {
        return {
          kind: "invalid_intent",
          issues: [
            {
              field: "amountMinor",
              message:
                "A reversal must mirror the original assignment's exact amount and currency.",
            },
          ],
        };
      }
      // Swap the endpoints: Money flows back where it came from. When the
      // original came straight from Unassigned Money (no source), the
      // reversing row is source-only and returns it there.
      sourceEnvelopeId = original.destinationEnvelopeId;
      destinationEnvelopeId = original.sourceEnvelopeId ?? "";
      amountMinor = original.amountMinor;
    } else if (input.sourceEnvelopeId) {
      // Envelope-to-envelope move — budget-neutral, no Unassigned guard.
      const source = await loadEnvelope(ctx, input.sourceEnvelopeId);
      if (!source) {
        return {
          kind: "missing_entity",
          entityType: "envelope",
          entityId: input.sourceEnvelopeId,
        };
      }
      if (source.currency !== input.currency) {
        return {
          kind: "invalid_intent",
          issues: [
            {
              field: "sourceEnvelopeId",
              message: `Source envelope lives in the ${source.currency} workspace.`,
            },
          ],
        };
      }
      sourceEnvelopeId = input.sourceEnvelopeId;
    }

    const facts = await getBudgetPoolFacts(
      ctx.db,
      ctx.householdId,
      input.currency,
      input.budgetPeriod,
    );

    // Waterfall routing applies to real top-ups and moves; a pure reversal
    // gives Money back instead.
    const consumesUnassigned = !input.reversesAssignmentId && sourceEnvelopeId === null;

    const predicate = preconditions.find((p) => p.predicate === "unassigned_money_gte");
    const requiredMinor =
      typeof predicate?.args?.minor === "number" ? predicate.args.minor : input.amountMinor;

    if (consumesUnassigned && facts.unassignedMinor < requiredMinor) {
      return predicate
        ? {
            kind: "conflict",
            reason: "unassigned_money_changed",
            current: { unassignedMinor: facts.unassignedMinor, requestedMinor: requiredMinor },
          }
        : {
            kind: "invalid_intent",
            issues: [
              {
                field: "amountMinor",
                message: `Only ${facts.unassignedMinor} minor units of Unassigned Money remain; ${requiredMinor} were requested.`,
              },
            ],
          };
    }

    const guards = [];
    if (consumesUnassigned) {
      // Bare scalar comparison — the pipeline wraps this in a CASE WHEN that
      // aborts the whole batch when Unassigned Money dipped below the
      // requirement between planning and commit.
      guards.push(
        sql`(SELECT ${unassignedMoneySql(ctx.householdId, input.currency, input.budgetPeriod)}) >= ${requiredMinor}`,
      );
    }

    let availabilityAfter: number | null = null;
    if (!input.reversesAssignmentId && destinationEnvelopeId) {
      const availableBefore = await getEnvelopeAssignedBalance(
        ctx.db,
        ctx.householdId,
        destinationEnvelopeId,
        input.budgetPeriod,
      );
      const routing = routeAssignment({
        amountMinor: input.amountMinor,
        destinationAvailableMinor: availableBefore,
        // Unfunded Card Spending arrives with #91; stage two consumes nothing yet.
        unfundedCardSpendingMinor: 0,
      });
      availabilityAfter = applyAssignmentToAvailability(availableBefore, routing);
    }

    return {
      effects: ["assignments", "projections", "summaries"],
      applied: {
        ...(input.reversesAssignmentId
          ? {
              reversalOf: input.reversesAssignmentId,
              unassignedAfter: facts.unassignedMinor + amountMinor,
            }
          : {
              envelopeId: destinationEnvelopeId,
              routing: routeAssignment({
                amountMinor,
                destinationAvailableMinor: 0,
                unfundedCardSpendingMinor: 0,
              }),
              unassignedAfter: facts.unassignedMinor - (consumesUnassigned ? amountMinor : 0),
            }),
        currency: input.currency,
        budgetPeriod: input.budgetPeriod,
        amountMinor,
        ...(availabilityAfter !== null && { availabilityAfter }),
      },
      guards,
      statements: [
        ctx.db
          .insert(assignment)
          .values({
            householdId: ctx.householdId,
            id: crypto.randomUUID(),
            currency: input.currency,
            budgetPeriod: input.budgetPeriod,
            destinationEnvelopeId: destinationEnvelopeId || null,
            sourceEnvelopeId,
            amountMinor,
            ...(input.reversesAssignmentId && {
              reversesAssignmentId: input.reversesAssignmentId,
            }),
            createdBy: ctx.actorUserId,
            updatedBy: ctx.actorUserId,
          })
          .onConflictDoNothing() as unknown as BatchStatement,
      ],
    };
  },
};
