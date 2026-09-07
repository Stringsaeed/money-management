import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { recurringRule } from "@trove/db/schema/recurring";
import { category, ledgerAccount } from "@trove/db/schema/ledger";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import { issuesFromZod } from "./shared";
import { privateAccountAccessRejection } from "./private-account";

const recurringDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(["expense", "income", "transfer"]),
    amountMinor: z.number().int().positive(),
    currency: z.string().length(3),
    accountId: z.string().min(1),
    toAccountId: z.string().min(1).nullable(),
    categoryId: z.string().min(1).nullable(),
    description: z.string().max(500),
    frequency: z.enum(["day", "week", "month", "year"]),
    intervalCount: z.number().int().positive(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    endCount: z.number().int().positive().nullable(),
    timeZone: z.string().min(1),
  })
  .superRefine((draft, context) => {
    if (draft.type === "transfer" && !draft.toAccountId) {
      context.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Choose a destination Account.",
      });
    }
    if (draft.type !== "transfer" && draft.toAccountId) {
      context.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Only transfers have a destination Account.",
      });
    }
    if (draft.toAccountId === draft.accountId) {
      context.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Choose a different destination Account.",
      });
    }
  });

const createSchema = z.object({
  action: z.literal("create"),
  ruleId: z.string().min(1),
  rule: recurringDraftSchema,
});
const draftChangeSchema = z.object({
  action: z.enum(["edit", "repair"]),
  ruleId: z.string().min(1),
  expectedRevision: z.number().int().positive(),
  rule: recurringDraftSchema,
});
const lifecycleSchema = z.object({
  action: z.enum(["pause", "resume", "archive", "restore"]),
  ruleId: z.string().min(1),
  expectedRevision: z.number().int().positive(),
});
const timeZoneSchema = z.object({
  action: z.literal("change_time_zone"),
  ruleId: z.string().min(1),
  expectedRevision: z.number().int().positive(),
  timeZone: z.string().min(1),
});

export const recurringChangePayloadSchema = z.discriminatedUnion("action", [
  createSchema,
  draftChangeSchema,
  lifecycleSchema,
  timeZoneSchema,
]);
type RecurringChangePayload = z.infer<typeof recurringChangePayloadSchema>;
type RecurringRuleRow = typeof recurringRule.$inferSelect;

const effects = ["rules", "upcoming"] as const;

export const recurringChangeHandler = {
  parsePayload(payload: unknown) {
    const result = recurringChangePayloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
    const input = payload as RecurringChangePayload;
    if (input.action === "create") return planCreate(ctx, input);

    const existing = await loadRule(ctx, input.ruleId);
    if (!existing) {
      return { kind: "missing_entity", entityType: "recurring_rule", entityId: input.ruleId };
    }
    if (existing.revision !== input.expectedRevision) {
      return {
        kind: "stale_version",
        entityId: input.ruleId,
        expectedVersion: input.expectedRevision,
        actualVersion: existing.revision,
      };
    }
    if (input.action === "edit" || input.action === "repair") {
      const dependencyRejection = await validateDependencies(ctx, input.rule);
      if (dependencyRejection) return dependencyRejection;
    }
    const lifecycleRejection = validateLifecycle(existing, input.action);
    if (lifecycleRejection) return lifecycleRejection;

    const revision = existing.revision + 1;
    const now = new Date();
    return {
      effects: [...effects],
      applied: { ruleId: existing.id, revision },
      guards: [revisionGuard(ctx, existing.id, existing.revision)],
      statements: [
        ctx.db
          .update(recurringRule)
          .set(changeSet(existing, input, revision, now, ctx.actorUserId))
          .where(
            and(eq(recurringRule.householdId, ctx.householdId), eq(recurringRule.id, existing.id)),
          ) as unknown as BatchStatement,
      ],
    };
  },
};

async function planCreate(
  ctx: PlanContext,
  input: Extract<RecurringChangePayload, { action: "create" }>,
): Promise<CommandPlan | PlanRejection> {
  if (await loadRule(ctx, input.ruleId)) {
    return { kind: "conflict", reason: "recurring_rule_id_already_exists" };
  }
  const dependencyRejection = await validateDependencies(ctx, input.rule);
  if (dependencyRejection) return dependencyRejection;
  return {
    effects: [...effects],
    applied: { ruleId: input.ruleId, revision: 1 },
    guards: [
      sql`(SELECT COUNT(*) FROM ${recurringRule}
          WHERE ${recurringRule.householdId} = ${ctx.householdId}
            AND ${recurringRule.id} = ${input.ruleId}) = 0`,
    ],
    statements: [
      ctx.db.insert(recurringRule).values({
        householdId: ctx.householdId,
        id: input.ruleId,
        ...draftValues(input.rule),
        lifecycle: "active",
        health: "ready",
        attentionReasons: "[]",
        eligibilityFloor: input.rule.startDate,
        revision: 1,
        createdBy: ctx.actorUserId,
        updatedBy: ctx.actorUserId,
      }) as unknown as BatchStatement,
    ],
  };
}

async function loadRule(ctx: PlanContext, ruleId: string): Promise<RecurringRuleRow | null> {
  const rows = await ctx.db
    .select()
    .from(recurringRule)
    .where(and(eq(recurringRule.householdId, ctx.householdId), eq(recurringRule.id, ruleId)))
    .limit(1);
  return rows[0] ?? null;
}

function revisionGuard(ctx: PlanContext, ruleId: string, revision: number) {
  return sql`(SELECT COUNT(*) FROM ${recurringRule}
      WHERE ${recurringRule.householdId} = ${ctx.householdId}
        AND ${recurringRule.id} = ${ruleId}
        AND ${recurringRule.revision} = ${revision}) = 1`;
}

function validateLifecycle(
  existing: RecurringRuleRow,
  action: Exclude<RecurringChangePayload["action"], "create">,
): PlanRejection | null {
  const required =
    action === "pause"
      ? "active"
      : action === "resume"
        ? "paused"
        : action === "restore"
          ? "archived"
          : null;
  if (required && existing.lifecycle !== required) {
    return {
      kind: "invalid_intent",
      issues: [{ field: "action", message: `${action} requires a ${required} Recurring Rule.` }],
    };
  }
  if (action === "archive" && existing.lifecycle === "archived") {
    return {
      kind: "invalid_intent",
      issues: [{ field: "action", message: "Recurring Rule is already archived." }],
    };
  }
  if (action === "repair" && existing.health !== "needs_attention") {
    return {
      kind: "invalid_intent",
      issues: [{ field: "action", message: "Only a Rule that Needs Attention can be repaired." }],
    };
  }
  return null;
}

function changeSet(
  existing: RecurringRuleRow,
  input: Exclude<RecurringChangePayload, { action: "create" }>,
  revision: number,
  now: Date,
  userId: string,
) {
  if (input.action === "edit" || input.action === "repair") {
    return {
      ...draftValues(input.rule),
      ...(input.action === "repair" && {
        health: "ready" as const,
        attentionReasons: "[]",
        attentionDetails: null,
        healthChangedAt: now,
      }),
      revision,
      updatedBy: userId,
      updatedAt: now,
    };
  }
  if (input.action === "change_time_zone") {
    return { timeZone: input.timeZone, revision, updatedBy: userId, updatedAt: now };
  }
  const lifecycle =
    input.action === "pause" || input.action === "archive" ? input.action + "d" : "active";
  return {
    lifecycle: lifecycle as "active" | "paused" | "archived",
    lifecycleChangedAt: now,
    eligibilityFloor:
      input.action === "resume" || input.action === "restore"
        ? existing.startDate
        : existing.eligibilityFloor,
    revision,
    updatedBy: userId,
    updatedAt: now,
  };
}

function draftValues(rule: z.infer<typeof recurringDraftSchema>) {
  return {
    name: rule.name,
    type: rule.type,
    amountMinor: rule.amountMinor,
    currency: rule.currency,
    accountId: rule.accountId,
    toAccountId: rule.toAccountId,
    categoryId: rule.categoryId,
    description: rule.description,
    frequency: rule.frequency,
    intervalCount: rule.intervalCount,
    startDate: rule.startDate,
    endDate: rule.endDate,
    endCount: rule.endCount,
    timeZone: rule.timeZone,
  };
}

async function validateDependencies(
  ctx: PlanContext,
  rule: z.infer<typeof recurringDraftSchema>,
): Promise<PlanRejection | null> {
  for (const accountId of [rule.accountId, rule.toAccountId]) {
    if (!accountId) continue;
    const rows = await ctx.db
      .select()
      .from(ledgerAccount)
      .where(and(eq(ledgerAccount.householdId, ctx.householdId), eq(ledgerAccount.id, accountId)))
      .limit(1);
    const account = rows[0];
    if (!account) return { kind: "missing_entity", entityType: "account", entityId: accountId };
    const privateRejection = privateAccountAccessRejection(ctx, account);
    if (privateRejection) return privateRejection;
    if (account.lifecycle !== "active" || account.currency !== rule.currency) {
      return {
        kind: "invalid_intent",
        issues: [{ field: "accountId", message: "Recurring Rule Account is not eligible." }],
      };
    }
  }
  if (!rule.categoryId) return null;
  const rows = await ctx.db
    .select()
    .from(category)
    .where(and(eq(category.householdId, ctx.householdId), eq(category.id, rule.categoryId)))
    .limit(1);
  if (!rows[0]) {
    return { kind: "missing_entity", entityType: "category", entityId: rule.categoryId };
  }
  return null;
}
