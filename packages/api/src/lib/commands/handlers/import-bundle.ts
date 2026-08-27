import { z } from "zod";

import {
  IMPORT_ENTITY_TYPES,
  MAX_IMPORT_CHUNK_ROWS,
  type EffectTag,
  type ImportBundlePayload,
  type ImportEntityType,
  type ValidationIssue,
} from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";
import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  rolloverSetting,
} from "@trove/db/schema/budget";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import { issuesFromZod } from "./shared";

/**
 * import_bundle (#98): the local-to-cloud migration's one-time bulk upload.
 * One command carries exactly one chunk of one entity type; the client sends
 * chunks in `IMPORT_ENTITY_TYPES` order so every reference (account before
 * transaction, envelope before assignment, ...) already exists by the time a
 * later chunk lands. Rows are inserted verbatim under the caller's ids, with
 * `onConflictDoNothing()` making a retried chunk safe to resend.
 *
 * Every table's `household_id`, `version` (0), and `created_by`/`updated_by`
 * (the importing owner) are stamped here — the client never sends them.
 */

const isoDateTime = z.string().min(1);

const LEDGER_EFFECTS: readonly EffectTag[] = ["ledger", "balances", "summaries", "projections"];
const RECURRING_EFFECTS: readonly EffectTag[] = ["rules", "upcoming"];
const BUDGET_EFFECTS: readonly EffectTag[] = [
  "envelopes",
  "assignments",
  "projections",
  "summaries",
];

/** Effect tags a chunk of `entityType` invalidates. */
function effectsFor(entityType: ImportEntityType): readonly EffectTag[] {
  switch (entityType) {
    case "account":
    case "category":
    case "transaction":
      return LEDGER_EFFECTS;
    case "recurringRule":
    case "recurringOccurrence":
      return RECURRING_EFFECTS;
    case "budgetWorkspace":
    case "envelope":
    case "categoryMapping":
    case "fundingMembership":
    case "rolloverSetting":
    case "assignment":
      return BUDGET_EFFECTS;
  }
}

const accountRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z.enum(["cash", "bank", "card"]),
  currency: z.string().min(3).max(3),
  color: z.string().min(1).max(32),
  icon: z.string().min(1).max(64),
  initialBalanceMinor: z.number().int(),
  excludeFromTotal: z.boolean(),
  sortOrder: z.number().int(),
  lifecycle: z.enum(["active", "archived"]),
  lifecycleChangedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const categoryRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z.enum(["income", "expense"]),
  color: z.string().min(1).max(32),
  icon: z.string().min(1).max(64),
  parentId: z.string().min(1).nullable(),
  sortOrder: z.number().int(),
  lifecycle: z.enum(["active", "archived"]),
  lifecycleChangedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const recurringRuleRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["expense", "income", "transfer"]),
  amountMinor: z.number().int().nullable(),
  currency: z.string().min(3).max(3),
  accountId: z.string().min(1).nullable(),
  toAccountId: z.string().min(1).nullable(),
  categoryId: z.string().min(1).nullable(),
  description: z.string(),
  frequency: z.enum(["day", "week", "month", "year"]),
  intervalCount: z.number().int().positive(),
  startDate: z.string().min(1),
  endDate: z.string().min(1).nullable(),
  endCount: z.number().int().nullable(),
  timeZone: z.string().min(1),
  lifecycle: z.enum(["active", "paused", "completed", "archived"]),
  health: z.enum(["ready", "needs_attention"]),
  attentionReasons: z.string(),
  attentionDetails: z.string().nullable(),
  eligibilityFloor: z.string().min(1),
  revision: z.number().int(),
  lifecycleChangedAt: isoDateTime.nullable(),
  healthChangedAt: isoDateTime.nullable(),
  lastSettlementAttemptAt: isoDateTime.nullable(),
  lastSettlementError: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const recurringOccurrenceRowSchema = z.object({
  ruleId: z.string().min(1),
  scheduledDate: z.string().min(1),
  transactionId: z.string().min(1).nullable(),
  settledAt: isoDateTime,
});

const transactionRowSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["expense", "income", "transfer"]),
  amountMinor: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  originalAmountMinor: z.number().int().nullable(),
  originalCurrency: z.string().nullable(),
  exchangeRate: z.number().int().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be a YYYY-MM-DD ledger date"),
  accountId: z.string().min(1),
  toAccountId: z.string().min(1).nullable(),
  categoryId: z.string().min(1).nullable(),
  isRecurring: z.boolean(),
  recurringRuleId: z.string().min(1).nullable(),
  description: z.string(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const budgetWorkspaceRowSchema = z.object({
  currency: z.string().min(3).max(3),
  activationPeriod: z.string().regex(/^\d{4}-\d{2}$/, "activationPeriod must be YYYY-MM"),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const envelopeRowSchema = z.object({
  id: z.string().min(1),
  currency: z.string().min(3).max(3),
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  lifecycle: z.enum(["active", "archived"]),
  sortOrder: z.number().int(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

const periodSchema = z.string().regex(/^\d{4}-\d{2}$/, "period must be YYYY-MM");

const categoryMappingRowSchema = z.object({
  categoryId: z.string().min(1),
  envelopeId: z.string().min(1).nullable(),
  effectiveFromPeriod: periodSchema,
  createdAt: isoDateTime,
});

const fundingMembershipRowSchema = z.object({
  accountId: z.string().min(1),
  currency: z.string().min(3).max(3),
  /** Client expands a local from/to period range into active + tombstone rows. */
  active: z.boolean(),
  effectiveFromPeriod: periodSchema,
  createdAt: isoDateTime,
});

const rolloverSettingRowSchema = z.object({
  envelopeId: z.string().min(1),
  positiveRollover: z.boolean(),
  effectiveFromPeriod: periodSchema,
  createdAt: isoDateTime,
});

const assignmentRowSchema = z.object({
  id: z.string().min(1),
  currency: z.string().min(3).max(3),
  budgetPeriod: periodSchema,
  sourceEnvelopeId: z.string().min(1).nullable(),
  destinationEnvelopeId: z.string().min(1).nullable(),
  amountMinor: z.number().int().positive(),
  reversesAssignmentId: z.string().min(1).nullable(),
  createdAt: isoDateTime,
});

/** Parses `rows` against `entityType`'s row schema, or collects the issues. */
function parseRows(
  entityType: ImportEntityType,
  rows: readonly unknown[],
):
  | { ok: true; value: readonly Record<string, unknown>[] }
  | { ok: false; issues: readonly ValidationIssue[] } {
  const schema = ROW_SCHEMA_BY_ENTITY[entityType];
  const result = z.array(schema).safeParse(rows);
  return result.success
    ? { ok: true, value: result.data as readonly Record<string, unknown>[] }
    : { ok: false, issues: issuesFromZod(result.error) };
}

const ROW_SCHEMA_BY_ENTITY = {
  account: accountRowSchema,
  category: categoryRowSchema,
  recurringRule: recurringRuleRowSchema,
  recurringOccurrence: recurringOccurrenceRowSchema,
  transaction: transactionRowSchema,
  budgetWorkspace: budgetWorkspaceRowSchema,
  envelope: envelopeRowSchema,
  categoryMapping: categoryMappingRowSchema,
  fundingMembership: fundingMembershipRowSchema,
  rolloverSetting: rolloverSettingRowSchema,
  assignment: assignmentRowSchema,
} satisfies Record<ImportEntityType, z.ZodType>;

/** Builds the one insert statement covering every row in this chunk. */
function buildInsertStatement(
  ctx: PlanContext,
  entityType: ImportEntityType,
  rows: readonly Record<string, unknown>[],
): BatchStatement {
  const householdId = ctx.householdId;
  const actorUserId = ctx.actorUserId;

  switch (entityType) {
    case "account": {
      const values = (rows as z.infer<typeof accountRowSchema>[]).map((row) => ({
        householdId,
        id: row.id,
        name: row.name,
        type: row.type,
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        initialBalanceMinor: row.initialBalanceMinor,
        excludeFromTotal: row.excludeFromTotal,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt ? new Date(row.lifecycleChangedAt) : null,
        visibility: "public" as const,
        ownerUserId: null,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
      return ctx.db
        .insert(ledgerAccount)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "category": {
      const values = (rows as z.infer<typeof categoryRowSchema>[]).map((row) => ({
        householdId,
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon,
        parentId: row.parentId,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt ? new Date(row.lifecycleChangedAt) : null,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
      return ctx.db
        .insert(category)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "recurringRule": {
      const values = (rows as z.infer<typeof recurringRuleRowSchema>[]).map((row) => ({
        householdId,
        id: row.id,
        name: row.name,
        type: row.type,
        amountMinor: row.amountMinor,
        currency: row.currency,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId: row.categoryId,
        description: row.description,
        frequency: row.frequency,
        intervalCount: row.intervalCount,
        startDate: row.startDate,
        endDate: row.endDate,
        endCount: row.endCount,
        timeZone: row.timeZone,
        lifecycle: row.lifecycle,
        health: row.health,
        attentionReasons: row.attentionReasons,
        attentionDetails: row.attentionDetails,
        eligibilityFloor: row.eligibilityFloor,
        revision: row.revision,
        lifecycleChangedAt: row.lifecycleChangedAt ? new Date(row.lifecycleChangedAt) : null,
        healthChangedAt: row.healthChangedAt ? new Date(row.healthChangedAt) : null,
        lastSettlementAttemptAt: row.lastSettlementAttemptAt
          ? new Date(row.lastSettlementAttemptAt)
          : null,
        lastSettlementError: row.lastSettlementError,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
      return ctx.db
        .insert(recurringRule)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "recurringOccurrence": {
      const values = (rows as z.infer<typeof recurringOccurrenceRowSchema>[]).map((row) => ({
        householdId,
        ruleId: row.ruleId,
        scheduledDate: row.scheduledDate,
        transactionId: row.transactionId,
        settledAt: new Date(row.settledAt),
      }));
      return ctx.db
        .insert(recurringOccurrence)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "transaction": {
      const values = (rows as z.infer<typeof transactionRowSchema>[]).map((row) => ({
        householdId,
        id: row.id,
        type: row.type,
        amountMinor: row.amountMinor,
        currency: row.currency,
        originalAmountMinor: row.originalAmountMinor,
        originalCurrency: row.originalCurrency,
        exchangeRate: row.exchangeRate,
        date: row.date,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId: row.categoryId,
        isRecurring: row.isRecurring,
        recurringRuleId: row.recurringRuleId,
        description: row.description,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
      return ctx.db
        .insert(transaction)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "budgetWorkspace": {
      const values = (rows as z.infer<typeof budgetWorkspaceRowSchema>[]).map((row) => ({
        householdId,
        currency: row.currency,
        activationPeriod: row.activationPeriod,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
      return ctx.db
        .insert(budgetWorkspace)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "envelope": {
      const values = (rows as z.infer<typeof envelopeRowSchema>[]).map((row) => ({
        id: row.id,
        householdId,
        currency: row.currency,
        name: row.name,
        icon: row.icon,
        color: row.color,
        lifecycle: row.lifecycle,
        sortOrder: row.sortOrder,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
      return ctx.db
        .insert(envelope)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "categoryMapping": {
      const values = (rows as z.infer<typeof categoryMappingRowSchema>[]).map((row) => ({
        householdId,
        categoryId: row.categoryId,
        envelopeId: row.envelopeId,
        effectiveFromPeriod: row.effectiveFromPeriod,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.createdAt),
      }));
      return ctx.db
        .insert(categoryMapping)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "fundingMembership": {
      const values = (rows as z.infer<typeof fundingMembershipRowSchema>[]).map((row) => ({
        householdId,
        accountId: row.accountId,
        currency: row.currency,
        active: row.active,
        effectiveFromPeriod: row.effectiveFromPeriod,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.createdAt),
      }));
      return ctx.db
        .insert(fundingMembership)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "rolloverSetting": {
      const values = (rows as z.infer<typeof rolloverSettingRowSchema>[]).map((row) => ({
        householdId,
        envelopeId: row.envelopeId,
        positiveRollover: row.positiveRollover,
        effectiveFromPeriod: row.effectiveFromPeriod,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.createdAt),
      }));
      return ctx.db
        .insert(rolloverSetting)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
    case "assignment": {
      const values = (rows as z.infer<typeof assignmentRowSchema>[]).map((row) => ({
        id: row.id,
        householdId,
        currency: row.currency,
        budgetPeriod: row.budgetPeriod,
        sourceEnvelopeId: row.sourceEnvelopeId,
        destinationEnvelopeId: row.destinationEnvelopeId,
        amountMinor: row.amountMinor,
        reversesAssignmentId: row.reversesAssignmentId,
        version: 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.createdAt),
      }));
      return ctx.db
        .insert(assignment)
        .values(values)
        .onConflictDoNothing() as unknown as BatchStatement;
    }
  }
}

const importBundleEnvelopeSchema = z
  .object({
    entityType: z.enum(IMPORT_ENTITY_TYPES),
    chunkIndex: z.number().int().nonnegative(),
    chunkCount: z.number().int().positive(),
    rows: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_IMPORT_CHUNK_ROWS),
  })
  .refine((value) => value.chunkIndex < value.chunkCount, {
    message: "chunkIndex must be less than chunkCount",
    path: ["chunkIndex"],
  });

export const importBundleHandler = {
  parsePayload(payload: unknown) {
    const result = importBundleEnvelopeSchema.safeParse(payload);
    return result.success
      ? { ok: true as const, value: result.data as ImportBundlePayload }
      : { ok: false as const, issues: issuesFromZod(result.error) };
  },

  async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
    const input = payload as ImportBundlePayload;
    const parsedRows = parseRows(input.entityType, input.rows);
    if (!parsedRows.ok) {
      return { kind: "invalid_intent", issues: parsedRows.issues };
    }

    return {
      effects: [...effectsFor(input.entityType)],
      applied: {
        entityType: input.entityType,
        chunkIndex: input.chunkIndex,
        chunkCount: input.chunkCount,
        inserted: parsedRows.value.length,
      },
      guards: [],
      statements: [buildInsertStatement(ctx, input.entityType, parsedRows.value)],
    };
  },
};
