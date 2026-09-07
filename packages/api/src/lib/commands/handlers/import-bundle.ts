import { inArray, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { z } from "zod";

import {
  IMPORT_ENTITY_TYPES,
  MAX_IMPORT_APPLY_ROWS,
  canonicalizeImportContent,
  type EffectTag,
  type ImportBundlePayload,
  type ImportContentRow,
  type ImportContentValue,
  type ImportEntityType,
  type ValidationIssue,
} from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import {
  accountContentRow,
  categoryContentRow,
  transactionContentRow,
} from "../../migration/import-content";
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

const isoDateTime = z.iso.datetime();

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
  return [buildInsertStatement(ctx, entityType, rows)];
}

async function findImportConflict(
  ctx: PlanContext,
  entityType: ImportEntityType,
  rows: readonly Record<string, unknown>[],
): Promise<string | null> {
  const ids = rows.map((row) => String(row.id));
  const incomingById = new Map(
    rows.map((row) => {
      const content = incomingContentRow(entityType, row);
      return [String(row.id), canonicalizeImportContent([content])] as const;
    }),
  );
  const existing = await loadExistingContentRows(ctx, entityType, ids);
  for (const { householdId, content } of existing) {
    const rowId = String(content.row.id);
    if (
      householdId !== ctx.householdId ||
      incomingById.get(rowId) !== canonicalizeImportContent([content])
    ) {
      return rowId;
    }
  }
  return null;
}

interface ExistingImportContentRow {
  readonly householdId: string;
  readonly content: ImportContentRow;
}

async function loadExistingContentRows(
  ctx: PlanContext,
  entityType: ImportEntityType,
  ids: readonly string[],
): Promise<readonly ExistingImportContentRow[]> {
  switch (entityType) {
    case "account":
      return (await ctx.db.select().from(ledgerAccount).where(inArray(ledgerAccount.id, ids))).map(
        (row) => ({ householdId: row.householdId, content: accountContentRow(row) }),
      );
    case "category":
      return (await ctx.db.select().from(category).where(inArray(category.id, ids))).map((row) => ({
        householdId: row.householdId,
        content: categoryContentRow(row),
      }));
    case "transaction":
      return (await ctx.db.select().from(transaction).where(inArray(transaction.id, ids))).map(
        (row) => ({ householdId: row.householdId, content: transactionContentRow(row) }),
      );
  }
}

function incomingContentRow(
  entityType: ImportEntityType,
  row: Readonly<Record<string, unknown>>,
): ImportContentRow {
  // SAFETY: parseRows accepts only the three flat scalar import row schemas above.
  const contentValues = row as Readonly<Record<string, ImportContentValue>>;
  const timestamps = {
    createdAt: new Date(String(row.createdAt)).toISOString(),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  };
  if (entityType === "transaction") {
    return { entityType, row: { ...contentValues, ...timestamps } };
  }
  return {
    entityType,
    row: {
      ...contentValues,
      ...timestamps,
      lifecycleChangedAt:
        row.lifecycleChangedAt == null
          ? null
          : new Date(String(row.lifecycleChangedAt)).toISOString(),
    },
  };
}

function buildConflictGuards(
  ctx: PlanContext,
  entityType: ImportEntityType,
  rows: readonly Record<string, unknown>[],
): SQL[] {
  return rows.map((row) => {
    switch (entityType) {
      case "account":
        return noDifferentAccount(ctx, row as z.infer<typeof accountRowSchema>);
      case "category":
        return noDifferentCategory(ctx, row as z.infer<typeof categoryRowSchema>);
      case "transaction":
        return noDifferentTransaction(ctx, row as z.infer<typeof transactionRowSchema>);
    }
  });
}

function noDifferentAccount(ctx: PlanContext, row: z.infer<typeof accountRowSchema>): SQL {
  return noDifferentRow(ledgerAccount, ledgerAccount.id, row.id, [
    same(ledgerAccount.householdId, ctx.householdId),
    same(ledgerAccount.name, row.name),
    same(ledgerAccount.type, row.type),
    same(ledgerAccount.currency, row.currency),
    same(ledgerAccount.color, row.color),
    same(ledgerAccount.icon, row.icon),
    same(ledgerAccount.initialBalanceMinor, row.initialBalanceMinor),
    same(ledgerAccount.excludeFromTotal, row.excludeFromTotal),
    same(ledgerAccount.sortOrder, row.sortOrder),
    same(ledgerAccount.lifecycle, row.lifecycle),
    same(
      ledgerAccount.lifecycleChangedAt,
      row.lifecycleChangedAt ? new Date(row.lifecycleChangedAt) : null,
    ),
    same(ledgerAccount.createdAt, new Date(row.createdAt)),
    same(ledgerAccount.updatedAt, new Date(row.updatedAt)),
  ]);
}

function noDifferentCategory(ctx: PlanContext, row: z.infer<typeof categoryRowSchema>): SQL {
  return noDifferentRow(category, category.id, row.id, [
    same(category.householdId, ctx.householdId),
    same(category.name, row.name),
    same(category.type, row.type),
    same(category.color, row.color),
    same(category.icon, row.icon),
    same(category.parentId, row.parentId),
    same(category.sortOrder, row.sortOrder),
    same(category.lifecycle, row.lifecycle),
    same(
      category.lifecycleChangedAt,
      row.lifecycleChangedAt ? new Date(row.lifecycleChangedAt) : null,
    ),
    same(category.createdAt, new Date(row.createdAt)),
    same(category.updatedAt, new Date(row.updatedAt)),
  ]);
}

function noDifferentTransaction(ctx: PlanContext, row: z.infer<typeof transactionRowSchema>): SQL {
  return noDifferentRow(transaction, transaction.id, row.id, [
    same(transaction.householdId, ctx.householdId),
    same(transaction.type, row.type),
    same(transaction.amountMinor, row.amountMinor),
    same(transaction.currency, row.currency),
    same(transaction.originalAmountMinor, row.originalAmountMinor),
    same(transaction.originalCurrency, row.originalCurrency),
    same(transaction.exchangeRate, row.exchangeRate),
    same(transaction.date, row.date),
    same(transaction.accountId, row.accountId),
    same(transaction.toAccountId, row.toAccountId),
    same(transaction.categoryId, row.categoryId),
    same(transaction.isRecurring, row.isRecurring),
    same(transaction.recurringRuleId, row.recurringRuleId),
    same(transaction.description, row.description),
    same(transaction.createdAt, new Date(row.createdAt)),
    same(transaction.updatedAt, new Date(row.updatedAt)),
  ]);
}

function same(column: SQLWrapper, value: unknown): SQL {
  return sql`${column} IS NOT DISTINCT FROM ${value}`;
}

function noDifferentRow(
  table: SQLWrapper,
  idColumn: SQLWrapper,
  id: string,
  matches: readonly SQL[],
): SQL {
  return sql`NOT EXISTS (SELECT 1 FROM ${table} WHERE ${idColumn} = ${id} AND NOT (${sql.join([...matches], sql` AND `)}))`;
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
    rows: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_IMPORT_APPLY_ROWS),
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
    const conflictingRowId = await findImportConflict(ctx, input.entityType, parsedRows.value);
    if (conflictingRowId) {
      return {
        kind: "conflict",
        reason: "import_row_conflict",
        current: { entityType: input.entityType, rowId: conflictingRowId },
      };
    }

    return {
      effects: [...LEDGER_EFFECTS],
      applied: {
        entityType: input.entityType,
        chunkIndex: input.chunkIndex,
        chunkCount: input.chunkCount,
        inserted: parsedRows.value.length,
      },
      guards: buildConflictGuards(ctx, input.entityType, parsedRows.value),
      statements: buildInsertStatements(ctx, input.entityType, parsedRows.value),
    };
  },
};
