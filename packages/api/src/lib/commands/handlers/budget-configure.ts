import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  rolloverSetting,
} from "@trove/db/schema/budget";
import { category, ledgerAccount } from "@trove/db/schema/ledger";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import { issuesFromZod } from "./shared";

const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const currencySchema = z.string().regex(/^[A-Z]{3}$/);
const envelopeFields = {
  name: z.string().trim().min(1).max(120),
  icon: z.string().min(1).max(64),
  color: z.string().min(1).max(32),
  categoryIds: z.array(z.string().min(1)),
  positiveRollover: z.boolean(),
  sortOrder: z.number().int(),
};

const payloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("workspace.activate"),
    currency: currencySchema,
    activationPeriod: periodSchema,
    fundingAccountIds: z.array(z.string().min(1)),
  }),
  z.object({
    action: z.literal("funding_membership.set"),
    accountId: z.string().min(1),
    currency: currencySchema,
    active: z.boolean(),
    effectiveFromPeriod: periodSchema,
  }),
  z.object({
    action: z.literal("envelope.create"),
    envelopeId: z.string().min(1),
    currency: currencySchema,
    effectiveFromPeriod: periodSchema,
    ...envelopeFields,
  }),
  z.object({
    action: z.literal("envelope.update"),
    envelopeId: z.string().min(1),
    expectedVersion: z.number().int().nonnegative(),
    effectiveFromPeriod: periodSchema,
    changedCategoryIds: z.array(z.string().min(1)),
    ...envelopeFields,
  }),
]);

type BudgetConfigurePayload = z.infer<typeof payloadSchema>;

export const budgetConfigureHandler = {
  parsePayload(payload: unknown) {
    const result = payloadSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
    const input = payload as BudgetConfigurePayload;
    if (input.action === "workspace.activate") return planWorkspace(ctx, input);
    if (input.action === "funding_membership.set") return planFundingMembership(ctx, input);
    if (input.action === "envelope.create") return planEnvelopeCreate(ctx, input);
    return planEnvelopeUpdate(ctx, input);
  },
};

async function planWorkspace(
  ctx: PlanContext,
  input: Extract<BudgetConfigurePayload, { action: "workspace.activate" }>,
): Promise<CommandPlan | PlanRejection> {
  const existing = await ctx.db
    .select()
    .from(budgetWorkspace)
    .where(
      and(
        eq(budgetWorkspace.householdId, ctx.householdId),
        eq(budgetWorkspace.currency, input.currency),
      ),
    )
    .limit(1);
  if (existing[0]) return { kind: "conflict", reason: "budget_workspace_already_exists" };
  const accountRejection = await validateFundingAccounts(
    ctx,
    input.fundingAccountIds,
    input.currency,
  );
  if (accountRejection) return accountRejection;
  const statements: BatchStatement[] = [
    ctx.db.insert(budgetWorkspace).values({
      householdId: ctx.householdId,
      currency: input.currency,
      activationPeriod: input.activationPeriod,
      createdBy: ctx.actorUserId,
      updatedBy: ctx.actorUserId,
    }) as unknown as BatchStatement,
  ];
  for (const accountId of input.fundingAccountIds) {
    statements.push(
      ctx.db.insert(fundingMembership).values({
        householdId: ctx.householdId,
        accountId,
        currency: input.currency,
        active: true,
        effectiveFromPeriod: input.activationPeriod,
        createdBy: ctx.actorUserId,
        updatedBy: ctx.actorUserId,
      }) as unknown as BatchStatement,
    );
  }
  return {
    effects: ["envelopes", "projections"],
    applied: { currency: input.currency, activationPeriod: input.activationPeriod },
    guards: [
      sql`(SELECT COUNT(*) FROM ${budgetWorkspace}
          WHERE ${budgetWorkspace.householdId} = ${ctx.householdId}
            AND ${budgetWorkspace.currency} = ${input.currency}) = 0`,
    ],
    statements,
  };
}

async function planFundingMembership(
  ctx: PlanContext,
  input: Extract<BudgetConfigurePayload, { action: "funding_membership.set" }>,
): Promise<CommandPlan | PlanRejection> {
  const accountRejection = await validateFundingAccounts(ctx, [input.accountId], input.currency);
  if (accountRejection) return accountRejection;
  return {
    effects: ["projections"],
    applied: { accountId: input.accountId, active: input.active },
    guards: [],
    statements: [
      ctx.db
        .insert(fundingMembership)
        .values({
          householdId: ctx.householdId,
          accountId: input.accountId,
          currency: input.currency,
          active: input.active,
          effectiveFromPeriod: input.effectiveFromPeriod,
          createdBy: ctx.actorUserId,
          updatedBy: ctx.actorUserId,
        })
        .onConflictDoNothing() as unknown as BatchStatement,
    ],
  };
}

async function planEnvelopeCreate(
  ctx: PlanContext,
  input: Extract<BudgetConfigurePayload, { action: "envelope.create" }>,
): Promise<CommandPlan | PlanRejection> {
  const existing = await loadEnvelope(ctx, input.envelopeId);
  if (existing) return { kind: "conflict", reason: "envelope_id_already_exists" };
  const workspaceRejection = await requireWorkspace(ctx, input.currency);
  if (workspaceRejection) return workspaceRejection;
  const categoryRejection = await validateCategories(ctx, input.categoryIds);
  if (categoryRejection) return categoryRejection;
  return {
    effects: ["envelopes", "projections"],
    applied: { envelopeId: input.envelopeId, version: 0 },
    guards: [
      sql`(SELECT COUNT(*) FROM ${envelope}
          WHERE ${envelope.householdId} = ${ctx.householdId}
            AND ${envelope.id} = ${input.envelopeId}) = 0`,
    ],
    statements: [
      ctx.db.insert(envelope).values({
        householdId: ctx.householdId,
        id: input.envelopeId,
        currency: input.currency,
        name: input.name,
        icon: input.icon,
        color: input.color,
        sortOrder: input.sortOrder,
        createdBy: ctx.actorUserId,
        updatedBy: ctx.actorUserId,
      }) as unknown as BatchStatement,
      ...configurationStatements(ctx, input.envelopeId, input.effectiveFromPeriod, input),
    ],
  };
}

async function planEnvelopeUpdate(
  ctx: PlanContext,
  input: Extract<BudgetConfigurePayload, { action: "envelope.update" }>,
): Promise<CommandPlan | PlanRejection> {
  const existing = await loadEnvelope(ctx, input.envelopeId);
  if (!existing) {
    return { kind: "missing_entity", entityType: "envelope", entityId: input.envelopeId };
  }
  if (existing.lifecycle !== "active") {
    return {
      kind: "invalid_intent",
      issues: [{ field: "envelopeId", message: "Restore this Envelope before editing it." }],
    };
  }
  if (existing.version !== input.expectedVersion) {
    return {
      kind: "stale_version",
      entityId: input.envelopeId,
      expectedVersion: input.expectedVersion,
      actualVersion: existing.version,
    };
  }
  const categoryRejection = await validateCategories(ctx, input.categoryIds);
  if (categoryRejection) return categoryRejection;
  const selected = new Set(input.categoryIds);
  const mappingInput = { ...input, categoryIds: input.changedCategoryIds };
  return {
    effects: ["envelopes", "projections"],
    applied: { envelopeId: input.envelopeId, version: existing.version + 1 },
    guards: [
      sql`(SELECT COUNT(*) FROM ${envelope}
          WHERE ${envelope.householdId} = ${ctx.householdId}
            AND ${envelope.id} = ${input.envelopeId}
            AND ${envelope.version} = ${input.expectedVersion}) = 1`,
    ],
    statements: [
      ctx.db
        .update(envelope)
        .set({
          name: input.name,
          icon: input.icon,
          color: input.color,
          sortOrder: input.sortOrder,
          version: existing.version + 1,
          updatedBy: ctx.actorUserId,
        })
        .where(
          and(eq(envelope.householdId, ctx.householdId), eq(envelope.id, input.envelopeId)),
        ) as unknown as BatchStatement,
      ...configurationStatements(
        ctx,
        input.envelopeId,
        input.effectiveFromPeriod,
        mappingInput,
        selected,
      ),
    ],
  };
}

function configurationStatements(
  ctx: PlanContext,
  envelopeId: string,
  period: string,
  input: { categoryIds: readonly string[]; positiveRollover: boolean },
  selected = new Set(input.categoryIds),
): BatchStatement[] {
  const statements: BatchStatement[] = input.categoryIds.map(
    (categoryId) =>
      ctx.db
        .insert(categoryMapping)
        .values({
          householdId: ctx.householdId,
          categoryId,
          envelopeId: selected.has(categoryId) ? envelopeId : null,
          effectiveFromPeriod: period,
          createdBy: ctx.actorUserId,
          updatedBy: ctx.actorUserId,
        })
        .onConflictDoNothing() as unknown as BatchStatement,
  );
  statements.push(
    ctx.db
      .insert(rolloverSetting)
      .values({
        householdId: ctx.householdId,
        envelopeId,
        positiveRollover: input.positiveRollover,
        effectiveFromPeriod: period,
        createdBy: ctx.actorUserId,
        updatedBy: ctx.actorUserId,
      })
      .onConflictDoNothing() as unknown as BatchStatement,
  );
  return statements;
}

async function loadEnvelope(ctx: PlanContext, envelopeId: string) {
  const rows = await ctx.db
    .select()
    .from(envelope)
    .where(and(eq(envelope.householdId, ctx.householdId), eq(envelope.id, envelopeId)))
    .limit(1);
  return rows[0] ?? null;
}

async function requireWorkspace(ctx: PlanContext, currency: string): Promise<PlanRejection | null> {
  const rows = await ctx.db
    .select()
    .from(budgetWorkspace)
    .where(
      and(eq(budgetWorkspace.householdId, ctx.householdId), eq(budgetWorkspace.currency, currency)),
    )
    .limit(1);
  return rows[0]
    ? null
    : { kind: "missing_entity", entityType: "budget_workspace", entityId: currency };
}

async function validateFundingAccounts(
  ctx: PlanContext,
  accountIds: readonly string[],
  currency: string,
): Promise<PlanRejection | null> {
  for (const accountId of accountIds) {
    const rows = await ctx.db
      .select()
      .from(ledgerAccount)
      .where(and(eq(ledgerAccount.householdId, ctx.householdId), eq(ledgerAccount.id, accountId)))
      .limit(1);
    const account = rows[0];
    if (!account) return { kind: "missing_entity", entityType: "account", entityId: accountId };
    if (
      account.lifecycle !== "active" ||
      account.visibility !== "public" ||
      account.currency !== currency ||
      account.type === "card"
    ) {
      return {
        kind: "invalid_intent",
        issues: [{ field: "fundingAccountIds", message: "Funding Account is not eligible." }],
      };
    }
  }
  return null;
}

async function validateCategories(
  ctx: PlanContext,
  categoryIds: readonly string[],
): Promise<PlanRejection | null> {
  for (const categoryId of categoryIds) {
    const rows = await ctx.db
      .select()
      .from(category)
      .where(and(eq(category.householdId, ctx.householdId), eq(category.id, categoryId)))
      .limit(1);
    const found = rows[0];
    if (!found) return { kind: "missing_entity", entityType: "category", entityId: categoryId };
    if (found.lifecycle !== "active" || found.type !== "expense") {
      return {
        kind: "invalid_intent",
        issues: [{ field: "categoryIds", message: "Envelope Categories must be active expenses." }],
      };
    }
  }
  return null;
}
