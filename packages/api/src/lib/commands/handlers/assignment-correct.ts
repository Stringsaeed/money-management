import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { assignment, envelope } from "@trove/db/schema/budget";

import { getBudgetPoolFacts } from "../../budget/funding-pool";
import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import { issuesFromZod, scopeColumns } from "./shared";

const payloadSchema = z
  .object({
    originalAssignmentId: z.string().min(1),
    reversalId: z.string().min(1),
    replacementId: z.string().min(1),
    currency: z.string().length(3),
    budgetPeriod: z.string().regex(/^\d{4}-\d{2}$/),
    sourceEnvelopeId: z.string().min(1).nullable(),
    destinationEnvelopeId: z.string().min(1).nullable(),
    amountMinor: z.number().int().positive(),
  })
  .refine(
    (input) =>
      (input.sourceEnvelopeId !== null || input.destinationEnvelopeId !== null) &&
      input.sourceEnvelopeId !== input.destinationEnvelopeId,
    { path: ["destinationEnvelopeId"], message: "Choose two different Money endpoints." },
  );
type AssignmentCorrectPayload = z.infer<typeof payloadSchema>;

export const assignmentCorrectHandler = {
  supportsPersonalScope: true as const,

  parsePayload(payload: unknown) {
    const result = payloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
    const input = payload as AssignmentCorrectPayload;
    const originalRows = await ctx.db
      .select()
      .from(assignment)
      .where(
        and(eq(assignment.ledgerId, ctx.ledgerId), eq(assignment.id, input.originalAssignmentId)),
      )
      .limit(1);
    const original = originalRows[0];
    if (!original) {
      return {
        kind: "missing_entity",
        entityType: "assignment",
        entityId: input.originalAssignmentId,
      };
    }
    if (
      original.reversesAssignmentId ||
      original.currency !== input.currency ||
      original.budgetPeriod !== input.budgetPeriod
    ) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "originalAssignmentId",
            message: "Only the original Assignment can be corrected in place.",
          },
        ],
      };
    }
    const alreadyReversed = await ctx.db
      .select({ id: assignment.id })
      .from(assignment)
      .where(
        and(
          eq(assignment.ledgerId, ctx.ledgerId),
          eq(assignment.reversesAssignmentId, original.id),
        ),
      )
      .limit(1);
    if (alreadyReversed[0]) {
      return {
        kind: "invalid_intent",
        issues: [
          { field: "originalAssignmentId", message: "Assignment has already been corrected." },
        ],
      };
    }
    const endpointRejection = await validateEndpoints(ctx, input);
    if (endpointRejection) return endpointRejection;

    const facts = await getBudgetPoolFacts(
      ctx.db,
      ctx.ledgerId,
      input.currency,
      input.budgetPeriod,
    );
    const restoredToUnassigned = original.sourceEnvelopeId === null ? original.amountMinor : 0;
    const consumedFromUnassigned = input.sourceEnvelopeId === null ? input.amountMinor : 0;
    if (facts.unassignedMinor + restoredToUnassigned < consumedFromUnassigned) {
      return {
        kind: "invalid_intent",
        issues: [
          { field: "amountMinor", message: "The corrected Assignment exceeds Unassigned Money." },
        ],
      };
    }

    return {
      effects: ["assignments", "projections", "summaries"],
      applied: {
        originalAssignmentId: original.id,
        reversalId: input.reversalId,
        replacementId: input.replacementId,
      },
      guards: [
        sql`(SELECT COUNT(*) FROM ${assignment}
            WHERE ${assignment.ledgerId} = ${ctx.ledgerId}
              AND ${assignment.reversesAssignmentId} = ${original.id}) = 0`,
      ],
      statements: [
        ctx.db.insert(assignment).values({
          ...scopeColumns(ctx),
          id: input.reversalId,
          currency: original.currency,
          budgetPeriod: original.budgetPeriod,
          sourceEnvelopeId: original.destinationEnvelopeId,
          destinationEnvelopeId: original.sourceEnvelopeId,
          amountMinor: original.amountMinor,
          reversesAssignmentId: original.id,
          createdBy: ctx.actorUserId,
          updatedBy: ctx.actorUserId,
        }) as unknown as BatchStatement,
        ctx.db.insert(assignment).values({
          ...scopeColumns(ctx),
          id: input.replacementId,
          currency: input.currency,
          budgetPeriod: input.budgetPeriod,
          sourceEnvelopeId: input.sourceEnvelopeId,
          destinationEnvelopeId: input.destinationEnvelopeId,
          amountMinor: input.amountMinor,
          reversesAssignmentId: input.reversalId,
          createdBy: ctx.actorUserId,
          updatedBy: ctx.actorUserId,
        }) as unknown as BatchStatement,
      ],
    };
  },
};

async function validateEndpoints(
  ctx: PlanContext,
  input: AssignmentCorrectPayload,
): Promise<PlanRejection | null> {
  for (const envelopeId of [input.sourceEnvelopeId, input.destinationEnvelopeId]) {
    if (!envelopeId) continue;
    const rows = await ctx.db
      .select()
      .from(envelope)
      .where(and(eq(envelope.ledgerId, ctx.ledgerId), eq(envelope.id, envelopeId)))
      .limit(1);
    const found = rows[0];
    if (!found) return { kind: "missing_entity", entityType: "envelope", entityId: envelopeId };
    if (found.currency !== input.currency || found.lifecycle !== "active") {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "currency",
            message: "Assignment endpoints must be active in the same workspace.",
          },
        ],
      };
    }
  }
  return null;
}
