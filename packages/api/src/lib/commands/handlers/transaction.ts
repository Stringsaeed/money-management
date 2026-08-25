import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

import type { EffectTag } from "@trove/protocol";
import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";

import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";
import { periodProjectionCache } from "@trove/db/schema/budget";

import { checkExpectedVersion, issuesFromZod } from "./shared";
import { privateAccountAccessRejection } from "./private-account";

/** Every ledger fact moves the ledger itself, balances, summaries, and projections. */
const TRANSACTION_EFFECTS: readonly EffectTag[] = [
  "ledger",
  "balances",
  "summaries",
  "projections",
];

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be a YYYY-MM-DD ledger date");

export const createTransactionPayloadSchema = z.object({
  /** Client-generated id (local-first); the server adopts it verbatim. */
  id: z.string().min(1).optional(),
  type: z.enum(["expense", "income", "transfer"]),
  amountMinor: z.number().int().positive(),
  date: dateSchema,
  accountId: z.string().min(1),
  toAccountId: z.string().min(1).nullable().default(null),
  categoryId: z.string().min(1).nullable().default(null),
  description: z.string().max(500).default(""),
  originalAmountMinor: z.number().int().positive().nullable().default(null),
  originalCurrency: z.string().min(3).max(3).nullable().default(null),
  exchangeRate: z.number().int().positive().nullable().default(null),
  isRecurring: z.boolean().default(false),
});

export const editTransactionPayloadSchema = z.object({
  transactionId: z.string().min(1),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  amountMinor: z.number().int().positive().optional(),
  date: dateSchema.optional(),
  accountId: z.string().min(1).optional(),
  toAccountId: z.string().min(1).nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  description: z.string().max(500).optional(),
});

export const removeTransactionPayloadSchema = z.object({
  transactionId: z.string().min(1),
});

type CreateTransactionPayload = z.infer<typeof createTransactionPayloadSchema>;
type EditTransactionPayload = z.infer<typeof editTransactionPayloadSchema>;

type TransactionRow = typeof transaction.$inferSelect;

async function loadTransaction(ctx: PlanContext, id: string): Promise<TransactionRow | null> {
  const rows = await ctx.db
    .select()
    .from(transaction)
    .where(and(eq(transaction.householdId, ctx.householdId), eq(transaction.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

async function loadAccount(
  ctx: PlanContext,
  accountId: string | null,
): Promise<typeof ledgerAccount.$inferSelect | null> {
  if (accountId === null) {
    return null;
  }
  const rows = await ctx.db
    .select()
    .from(ledgerAccount)
    .where(and(eq(ledgerAccount.householdId, ctx.householdId), eq(ledgerAccount.id, accountId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * ADR-0005: a correction to a past transaction recalculates its Budget
 * Period and every later Rollover. Until #90 builds live waterfalls, that
 * recalculation is expressed as cache invalidation: every cached projection
 * at or after the earliest affected period is dropped and recomputed on next
 * read, stamped with the change's seq.
 */
function invalidateProjectionsFrom(ctx: PlanContext, period: string): BatchStatement {
  return ctx.db.delete(periodProjectionCache).where(
    and(
      eq(periodProjectionCache.householdId, ctx.householdId),
      // String comparison is correct because both sides are zero-padded YYYY-MM.
      gte(periodProjectionCache.budgetPeriod, period),
    ),
  ) as unknown as BatchStatement;
}

/** Budget Period ("YYYY-MM") of a ledger date — ADR-0021 attribution anchor. */
export const budgetPeriodOf = (ledgerDate: string): string => ledgerDate.slice(0, 7);

interface ValidatedShape {
  type: "expense" | "income" | "transfer";
  amountMinor: number;
  date: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
}

/**
 * Shared shape validation for create/edit: account existence, transfer
 * shape, and category-type coherence produce typed rejections before any
 * statement is built. Returns the resolved transaction currency too.
 */
async function validateShape(
  ctx: PlanContext,
  shape: ValidatedShape,
): Promise<PlanRejection | { ok: true; currency: string }> {
  const account = await loadAccount(ctx, shape.accountId);
  if (!account) {
    return { kind: "missing_entity", entityType: "account", entityId: shape.accountId };
  }
  const accountAccessRejection = privateAccountAccessRejection(ctx, account);
  if (accountAccessRejection) {
    return accountAccessRejection;
  }

  if (shape.type === "transfer") {
    if (!shape.toAccountId) {
      return {
        kind: "invalid_intent",
        issues: [{ field: "toAccountId", message: "Transfers require a destination account." }],
      };
    }
    if (shape.toAccountId === shape.accountId) {
      return {
        kind: "invalid_intent",
        issues: [
          { field: "toAccountId", message: "A transfer must move between two different accounts." },
        ],
      };
    }
    const destination = await loadAccount(ctx, shape.toAccountId);
    if (!destination) {
      return { kind: "missing_entity", entityType: "account", entityId: shape.toAccountId };
    }
    const destinationAccessRejection = privateAccountAccessRejection(ctx, destination);
    if (destinationAccessRejection) {
      return destinationAccessRejection;
    }
    if (destination.currency !== account.currency) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "toAccountId",
            message:
              "Cross-currency transfers are unsupported; use one Budget Workspace per currency.",
          },
        ],
      };
    }
    if (shape.categoryId !== null) {
      return {
        kind: "invalid_intent",
        issues: [{ field: "categoryId", message: "Transfers carry no category." }],
      };
    }
  } else {
    if (shape.toAccountId !== null) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "toAccountId",
            message: "Only transfers may reference a destination account.",
          },
        ],
      };
    }
    if (shape.categoryId === null) {
      return {
        kind: "invalid_intent",
        issues: [
          { field: "categoryId", message: `${shape.type} transactions require a category.` },
        ],
      };
    }
    const categoryRows = await ctx.db
      .select()
      .from(category)
      .where(and(eq(category.householdId, ctx.householdId), eq(category.id, shape.categoryId)))
      .limit(1);
    const txCategory = categoryRows[0];
    if (!txCategory) {
      return { kind: "missing_entity", entityType: "category", entityId: shape.categoryId };
    }
    if (txCategory.type !== shape.type) {
      return {
        kind: "invalid_intent",
        issues: [
          {
            field: "categoryId",
            message: `A ${shape.type} transaction requires a ${shape.type} category; "${txCategory.name}" is ${txCategory.type}.`,
          },
        ],
      };
    }
  }

  return { ok: true, currency: account.currency };
}

function versionGuard(ctx: PlanContext, id: string, expectedVersion: number) {
  return and(
    eq(transaction.householdId, ctx.householdId),
    eq(transaction.id, id),
    eq(transaction.version, expectedVersion),
  );
}

export const transactionHandlers = {
  "transaction.create": {
    parsePayload(payload: unknown) {
      const result = createTransactionPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
      const input = payload as CreateTransactionPayload;
      const transactionId = input.id ?? crypto.randomUUID();

      if (await loadTransaction(ctx, transactionId)) {
        return {
          kind: "conflict",
          reason: "transaction_id_already_exists",
          current: { transactionId },
        };
      }
      const shape = await validateShape(ctx, {
        type: input.type,
        amountMinor: input.amountMinor,
        date: input.date,
        accountId: input.accountId,
        toAccountId: input.toAccountId,
        categoryId: input.categoryId,
      });
      if ("kind" in shape) {
        return shape;
      }

      return {
        effects: [...TRANSACTION_EFFECTS],
        applied: {
          transactionId,
          type: input.type,
          amountMinor: input.amountMinor,
          date: input.date,
        },
        guards: [],
        statements: [
          ctx.db
            .insert(transaction)
            .values({
              householdId: ctx.householdId,
              id: transactionId,
              type: input.type,
              amountMinor: input.amountMinor,
              currency: shape.currency,
              originalAmountMinor: input.originalAmountMinor,
              originalCurrency: input.originalCurrency,
              exchangeRate: input.exchangeRate,
              date: input.date,
              accountId: input.accountId,
              toAccountId: input.toAccountId,
              categoryId: input.categoryId,
              isRecurring: input.isRecurring,
              description: input.description,
              createdBy: ctx.actorUserId,
              updatedBy: ctx.actorUserId,
            })
            .onConflictDoNothing() as unknown as BatchStatement,
          invalidateProjectionsFrom(ctx, budgetPeriodOf(input.date)),
        ],
      };
    },
  },

  "transaction.edit": {
    parsePayload(payload: unknown) {
      const result = editTransactionPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(
      ctx: PlanContext,
      { payload, preconditions }: PlanRequest,
    ): Promise<CommandPlan | PlanRejection> {
      const input = payload as EditTransactionPayload;

      const existing = await loadTransaction(ctx, input.transactionId);
      if (!existing) {
        return {
          kind: "missing_entity",
          entityType: "transaction",
          entityId: input.transactionId,
        };
      }
      const stale = checkExpectedVersion(existing, preconditions);
      if (stale) {
        return stale;
      }

      // Merge onto the current row, then re-validate the whole shape.
      const merged: ValidatedShape = {
        type: input.type ?? existing.type,
        amountMinor: input.amountMinor ?? existing.amountMinor,
        date: input.date ?? existing.date,
        accountId: input.accountId ?? existing.accountId,
        toAccountId: input.toAccountId !== undefined ? input.toAccountId : existing.toAccountId,
        categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      };
      const shape = await validateShape(ctx, merged);
      if ("kind" in shape) {
        return shape;
      }

      const rowGuard = versionGuard(ctx, existing.id, existing.version);
      const affectedPeriod = [budgetPeriodOf(existing.date), budgetPeriodOf(merged.date)]
        .sort()
        .shift()!;

      return {
        effects: [...TRANSACTION_EFFECTS],
        applied: { transactionId: existing.id, ...merged },
        guards: [sql`(SELECT COUNT(*) FROM ${transaction} WHERE ${rowGuard}) = 1`],
        statements: [
          ctx.db
            .update(transaction)
            .set({
              type: merged.type,
              amountMinor: merged.amountMinor,
              date: merged.date,
              accountId: merged.accountId,
              toAccountId: merged.toAccountId,
              categoryId: merged.categoryId,
              ...(input.description !== undefined && { description: input.description }),
              currency: shape.currency,
              updatedBy: ctx.actorUserId,
              version: sql`${transaction.version} + 1`,
            })
            .where(rowGuard) as unknown as BatchStatement,
          invalidateProjectionsFrom(ctx, affectedPeriod),
        ],
      };
    },
  },

  "transaction.remove": {
    parsePayload(payload: unknown) {
      const result = removeTransactionPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(
      ctx: PlanContext,
      { payload, preconditions }: PlanRequest,
    ): Promise<CommandPlan | PlanRejection> {
      const input = payload as { transactionId: string };

      const existing = await loadTransaction(ctx, input.transactionId);
      if (!existing) {
        return {
          kind: "missing_entity",
          entityType: "transaction",
          entityId: input.transactionId,
        };
      }
      const sourceAccount = await loadAccount(ctx, existing.accountId);
      if (!sourceAccount) {
        return {
          kind: "missing_entity",
          entityType: "account",
          entityId: existing.accountId,
        };
      }
      const sourceAccessRejection = privateAccountAccessRejection(ctx, sourceAccount);
      if (sourceAccessRejection) {
        return sourceAccessRejection;
      }
      if (existing.toAccountId) {
        const destinationAccount = await loadAccount(ctx, existing.toAccountId);
        if (!destinationAccount) {
          return {
            kind: "missing_entity",
            entityType: "account",
            entityId: existing.toAccountId,
          };
        }
        const destinationAccessRejection = privateAccountAccessRejection(ctx, destinationAccount);
        if (destinationAccessRejection) {
          return destinationAccessRejection;
        }
      }
      const stale = checkExpectedVersion(existing, preconditions);
      if (stale) {
        return stale;
      }

      const rowGuard = versionGuard(ctx, existing.id, existing.version);

      return {
        effects: [...TRANSACTION_EFFECTS],
        applied: { transactionId: existing.id, removed: true },
        guards: [sql`(SELECT COUNT(*) FROM ${transaction} WHERE ${rowGuard}) = 1`],
        statements: [
          ctx.db.delete(transaction).where(rowGuard) as unknown as BatchStatement,
          invalidateProjectionsFrom(ctx, budgetPeriodOf(existing.date)),
        ],
      };
    },
  },
};
