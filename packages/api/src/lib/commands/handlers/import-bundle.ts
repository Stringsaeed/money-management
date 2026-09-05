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

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import { issuesFromZod } from "./shared";

/**
 * import_bundle (#98): the local-to-cloud migration's one-time bulk upload.
 * One command carries exactly one chunk of one entity type; the client sends
 * chunks in `IMPORT_ENTITY_TYPES` order so every reference (account before
 * transaction) already exists by the time a later chunk lands. Rows are
 * inserted verbatim under the caller's ids, with `onConflictDoNothing()`
 * making a retried chunk safe to resend.
 *
 * Every table's `household_id`, `version` (0), and `created_by`/`updated_by`
 * (the importing owner) are stamped here — the client never sends them.
 */

const isoDateTime = z.string().min(1);

const LEDGER_EFFECTS: readonly EffectTag[] = ["ledger", "balances", "summaries", "projections"];

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
  transaction: transactionRowSchema,
} satisfies Record<ImportEntityType, z.ZodType>;

function buildInsertStatements(
  ctx: PlanContext,
  entityType: ImportEntityType,
  rows: readonly Record<string, unknown>[],
): BatchStatement[] {
  const maxRowsPerStatement = maxRowsPerInsertStatement(entityType);
  const statements: BatchStatement[] = [];
  for (let start = 0; start < rows.length; start += maxRowsPerStatement) {
    statements.push(
      buildInsertStatement(ctx, entityType, rows.slice(start, start + maxRowsPerStatement)),
    );
  }
  return statements;
}

/** D1 rejects queries with more than 100 bound parameters. */
const D1_MAX_BOUND_PARAMS = 100;

const INSERT_COLUMNS_BY_ENTITY = {
  account: 19,
  category: 15,
  transaction: 20,
} as const satisfies Record<ImportEntityType, number>;

export function maxRowsPerInsertStatement(entityType: ImportEntityType): number {
  return Math.max(1, Math.floor(D1_MAX_BOUND_PARAMS / INSERT_COLUMNS_BY_ENTITY[entityType]));
}

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
      effects: [...LEDGER_EFFECTS],
      applied: {
        entityType: input.entityType,
        chunkIndex: input.chunkIndex,
        chunkCount: input.chunkCount,
        inserted: parsedRows.value.length,
      },
      guards: [],
      statements: buildInsertStatements(ctx, input.entityType, parsedRows.value),
    };
  },
};
