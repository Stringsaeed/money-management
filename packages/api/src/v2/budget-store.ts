import { and, asc, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Context, Effect, Layer } from "effect";

import type { BudgetAssignment, PaydayChange, PaydayRule } from "@trove/domain/budget";
import {
  v2Assignment,
  v2Budget,
  v2BudgetFundingAccount,
  v2BudgetPayday,
  v2Envelope,
  v2EnvelopeCategory,
} from "@trove/db/schema/v2-budget";
import { v2Identity } from "@trove/db/schema/v2-identity";

import { storeFailure } from "./budget-errors";
import { BudgetLedger, LedgerDb } from "./budget-services";
import type { V2BudgetActivityItem } from "./contracts";
import { iso, safeMinor, type V2DbExecutor } from "./shared";

/**
 * The budget plan tables (`v2_budgets` and its children), the system of record
 * for the plan. Every total is derived on read from these rows plus ledger
 * Transactions; nothing here stores a balance. Assignments are append-only.
 */

export type BudgetRow = typeof v2Budget.$inferSelect;
export type EnvelopeRow = typeof v2Envelope.$inferSelect;
export type MappedEnvelope = EnvelopeRow & { readonly categoryIds: readonly string[] };

/** The rows one activation writes, in one transaction. */
export interface NewBudgetPlan {
  readonly budget: typeof v2Budget.$inferInsert;
  readonly payday: typeof v2BudgetPayday.$inferInsert;
  readonly funding: readonly (typeof v2BudgetFundingAccount.$inferInsert)[];
  readonly envelopes: readonly (typeof v2Envelope.$inferInsert)[];
  readonly mappings: readonly (typeof v2EnvelopeCategory.$inferInsert)[];
  readonly assignments: readonly NewAssignment[];
}

export type NewAssignment = typeof v2Assignment.$inferInsert;
export type BudgetPatch = Partial<
  Pick<BudgetRow, "usualSalaryMinor" | "paydayReminder" | "defaultAccountId">
>;
export type EnvelopePatch = Partial<
  Pick<
    EnvelopeRow,
    "name" | "group" | "startFresh" | "lifecycle" | "targetMinor" | "dueDate" | "repeat"
  >
>;

/** The stored plan of one budget: payday history, funding, active envelopes, assignment sums. */
export interface StoredPlan {
  readonly paydays: readonly PaydayChange[];
  readonly fundingAccountIds: readonly string[];
  readonly envelopes: readonly MappedEnvelope[];
  readonly assignments: readonly BudgetAssignment[];
}

const make = Effect.gen(function* () {
  const db = yield* LedgerDb;
  const { ledgerId } = yield* BudgetLedger;
  const run = <A>(operation: string, query: (db: V2DbExecutor) => PromiseLike<A>) =>
    Effect.tryPromise({ try: () => query(db), catch: storeFailure(operation) });

  return {
    findBudget: run("budget.find", async (db) => {
      const rows = await db.select().from(v2Budget).where(eq(v2Budget.ledgerId, ledgerId)).limit(1);
      return rows[0] && decodeBudget(rows[0]);
    }),

    loadPlan: (budget: BudgetRow) => run("budget.loadPlan", (db) => loadPlan(db, ledgerId, budget)),

    insertPlan: (plan: NewBudgetPlan) =>
      run("budget.insertPlan", async (db) => {
        await db.insert(v2Budget).values(plan.budget);
        await db.insert(v2BudgetPayday).values(plan.payday);
        await db.insert(v2BudgetFundingAccount).values([...plan.funding]);
        await db.insert(v2Envelope).values([...plan.envelopes]);
        if (plan.mappings.length > 0) {
          await db.insert(v2EnvelopeCategory).values([...plan.mappings]);
        }
        if (plan.assignments.length > 0)
          await db.insert(v2Assignment).values([...plan.assignments]);
      }),

    updateBudget: (budgetId: string, patch: BudgetPatch, actor: string) =>
      run("budget.update", async (db) => {
        const rows = await db
          .update(v2Budget)
          .set({
            ...patch,
            version: sql`${v2Budget.version} + 1`,
            updatedBy: actor,
            updatedAt: new Date(),
          })
          .where(eq(v2Budget.id, budgetId))
          .returning();
        return rows[0] && decodeBudget(rows[0]);
      }),

    /**
     * A payday change that has not started yet is replaced by this one (or
     * dropped when `effectiveFrom` is null). History is insert-only per period
     * start; a second change for the same start replaces only that row.
     */
    recordPaydayChange: (
      budgetId: string,
      currentStart: string,
      effectiveFrom: string | null,
      rule: PaydayRule,
      actor: string,
    ) =>
      run("budget.recordPaydayChange", async (db) => {
        await db
          .delete(v2BudgetPayday)
          .where(
            and(
              eq(v2BudgetPayday.budgetId, budgetId),
              gt(v2BudgetPayday.effectiveFrom, currentStart),
              ...(effectiveFrom ? [ne(v2BudgetPayday.effectiveFrom, effectiveFrom)] : []),
            ),
          );
        if (!effectiveFrom) return;
        await db
          .insert(v2BudgetPayday)
          .values({ ledgerId, budgetId, effectiveFrom, ...paydayColumns(rule), createdBy: actor })
          .onConflictDoUpdate({
            target: [v2BudgetPayday.budgetId, v2BudgetPayday.effectiveFrom],
            set: { ...paydayColumns(rule), createdBy: actor, createdAt: new Date() },
          });
      }),

    findEnvelope: (budgetId: string, envelopeId: string) =>
      run("budget.findEnvelope", async (db) => {
        const rows = await db
          .select()
          .from(v2Envelope)
          .where(and(eq(v2Envelope.budgetId, budgetId), eq(v2Envelope.id, envelopeId)))
          .limit(1);
        return rows[0] && decodeEnvelope(rows[0]);
      }),

    nextSortOrder: (budgetId: string) =>
      run("budget.nextSortOrder", async (db) => {
        const rows = await db
          .select({ sortOrder: sql<number>`coalesce(max(${v2Envelope.sortOrder}), -1)` })
          .from(v2Envelope)
          .where(eq(v2Envelope.budgetId, budgetId));
        return (rows[0]?.sortOrder ?? -1) + 1;
      }),

    insertEnvelope: (
      envelope: typeof v2Envelope.$inferInsert,
      categoryId: string,
      assignment: NewAssignment | undefined,
    ) =>
      run("budget.insertEnvelope", async (db) => {
        await db.insert(v2Envelope).values(envelope);
        await db
          .insert(v2EnvelopeCategory)
          .values({ ledgerId, envelopeId: envelope.id, categoryId });
        if (assignment) await db.insert(v2Assignment).values(assignment);
      }),

    updateEnvelope: (envelopeId: string, patch: EnvelopePatch, actor: string) =>
      run("budget.updateEnvelope", (db) =>
        db
          .update(v2Envelope)
          .set({
            ...patch,
            version: sql`${v2Envelope.version} + 1`,
            updatedBy: actor,
            updatedAt: new Date(),
          })
          .where(eq(v2Envelope.id, envelopeId)),
      ),

    /** Which envelopes the given Categories map to (a Category maps to at most one). */
    mappingsOf: (categoryIds: readonly string[]) =>
      run("budget.mappingsOf", (db) =>
        db
          .select({
            envelopeId: v2EnvelopeCategory.envelopeId,
            categoryId: v2EnvelopeCategory.categoryId,
          })
          .from(v2EnvelopeCategory)
          .where(
            and(
              eq(v2EnvelopeCategory.ledgerId, ledgerId),
              inArray(v2EnvelopeCategory.categoryId, [...categoryIds]),
            ),
          ),
      ),

    replaceMappings: (envelopeId: string, categoryIds: readonly string[]) =>
      run("budget.replaceMappings", async (db) => {
        await db.delete(v2EnvelopeCategory).where(eq(v2EnvelopeCategory.envelopeId, envelopeId));
        if (categoryIds.length === 0) return;
        await db
          .insert(v2EnvelopeCategory)
          .values(categoryIds.map((categoryId) => ({ ledgerId, envelopeId, categoryId })));
      }),

    /** The envelope's first mapped Category by id, where a big payment is recorded. */
    firstCategoryOf: (envelopeId: string) =>
      run("budget.firstCategoryOf", async (db) => {
        const rows = await db
          .select({ categoryId: v2EnvelopeCategory.categoryId })
          .from(v2EnvelopeCategory)
          .where(eq(v2EnvelopeCategory.envelopeId, envelopeId))
          .orderBy(asc(v2EnvelopeCategory.categoryId))
          .limit(1);
        return rows[0]?.categoryId;
      }),

    insertAssignments: (assignments: readonly NewAssignment[]) =>
      run("budget.insertAssignments", (db) => db.insert(v2Assignment).values([...assignments])),

    /** Newest assignments first, LIMIT-bounded, with envelope and author names. */
    listActivity: (budgetId: string, limit: number) =>
      run("budget.listActivity", (db) => listActivity(db, budgetId, limit)),
  };
});

export class BudgetStore extends Context.Service<BudgetStore, Effect.Success<typeof make>>()(
  "@trove/api/v2/BudgetStore",
) {
  static readonly layer = Layer.effect(BudgetStore, make);
}

async function loadPlan(
  db: V2DbExecutor,
  ledgerId: string,
  budget: BudgetRow,
): Promise<StoredPlan> {
  const [paydayRows, fundingRows, envelopeRows, assignmentRows] = await Promise.all([
    db.select().from(v2BudgetPayday).where(eq(v2BudgetPayday.budgetId, budget.id)),
    db
      .select({ accountId: v2BudgetFundingAccount.accountId })
      .from(v2BudgetFundingAccount)
      .where(eq(v2BudgetFundingAccount.budgetId, budget.id))
      .orderBy(asc(v2BudgetFundingAccount.createdAt), asc(v2BudgetFundingAccount.accountId)),
    db
      .select()
      .from(v2Envelope)
      .where(and(eq(v2Envelope.budgetId, budget.id), eq(v2Envelope.lifecycle, "active")))
      .orderBy(asc(v2Envelope.sortOrder), asc(v2Envelope.id)),
    // One row per (period, from, to, reason): bounded by periods x envelope pairs, not by moves.
    db
      .select({
        periodStart: v2Assignment.periodStart,
        fromEnvelopeId: v2Assignment.fromEnvelopeId,
        toEnvelopeId: v2Assignment.toEnvelopeId,
        reason: v2Assignment.reason,
        amountMinor: sql<string>`sum(${v2Assignment.amountMinor})`,
      })
      .from(v2Assignment)
      .where(eq(v2Assignment.budgetId, budget.id))
      .groupBy(
        v2Assignment.periodStart,
        v2Assignment.fromEnvelopeId,
        v2Assignment.toEnvelopeId,
        v2Assignment.reason,
      ),
  ]);
  const envelopeIds = envelopeRows.map((row) => row.id);
  const mappingRows =
    envelopeIds.length === 0
      ? []
      : await db
          .select({
            envelopeId: v2EnvelopeCategory.envelopeId,
            categoryId: v2EnvelopeCategory.categoryId,
          })
          .from(v2EnvelopeCategory)
          .where(
            and(
              eq(v2EnvelopeCategory.ledgerId, ledgerId),
              inArray(v2EnvelopeCategory.envelopeId, envelopeIds),
            ),
          );
  return {
    paydays: paydayRows.map(paydayChange),
    fundingAccountIds: fundingRows.map((row) => row.accountId),
    envelopes: envelopeRows.map((row) => ({
      ...decodeEnvelope(row),
      categoryIds: mappingRows
        .filter((mapping) => mapping.envelopeId === row.id)
        .map((mapping) => mapping.categoryId)
        .sort(),
    })),
    assignments: assignmentRows.map((row) => ({
      periodStart: row.periodStart,
      fromEnvelopeId: row.fromEnvelopeId,
      toEnvelopeId: row.toEnvelopeId,
      amountMinor: safeMinor(row.amountMinor, "Assignment total"),
      reason: row.reason,
    })),
  };
}

async function listActivity(
  db: V2DbExecutor,
  budgetId: string,
  limit: number,
): Promise<V2BudgetActivityItem[]> {
  const fromEnvelope = alias(v2Envelope, "from_envelope");
  const toEnvelope = alias(v2Envelope, "to_envelope");
  const rows = await db
    .select({
      id: v2Assignment.id,
      periodStart: v2Assignment.periodStart,
      fromEnvelopeId: v2Assignment.fromEnvelopeId,
      fromName: fromEnvelope.name,
      toEnvelopeId: v2Assignment.toEnvelopeId,
      toName: toEnvelope.name,
      amountMinor: v2Assignment.amountMinor,
      reason: v2Assignment.reason,
      createdBy: v2Assignment.createdBy,
      createdByName: v2Identity.name,
      createdAt: v2Assignment.createdAt,
    })
    .from(v2Assignment)
    .leftJoin(fromEnvelope, eq(fromEnvelope.id, v2Assignment.fromEnvelopeId))
    .leftJoin(toEnvelope, eq(toEnvelope.id, v2Assignment.toEnvelopeId))
    .leftJoin(v2Identity, eq(v2Identity.id, v2Assignment.createdBy))
    .where(eq(v2Assignment.budgetId, budgetId))
    .orderBy(desc(v2Assignment.createdAt), desc(v2Assignment.id))
    .limit(limit);
  return rows.map((row) => ({
    ...row,
    amountMinor: safeMinor(row.amountMinor, "Assignment amount"),
    createdAt: iso(row.createdAt),
  }));
}

/** Money read back must be a safe integer; `safeMinor` refuses anything else. */
function decodeBudget(row: BudgetRow): BudgetRow {
  return {
    ...row,
    usualSalaryMinor:
      row.usualSalaryMinor === null ? null : safeMinor(row.usualSalaryMinor, "Usual salary"),
  };
}

function decodeEnvelope(row: EnvelopeRow): EnvelopeRow {
  return {
    ...row,
    targetMinor: row.targetMinor === null ? null : safeMinor(row.targetMinor, "Envelope target"),
  };
}

function paydayChange(row: typeof v2BudgetPayday.$inferSelect): PaydayChange {
  return {
    effectiveFrom: row.effectiveFrom,
    rule:
      row.kind === "day" && row.day !== null
        ? { kind: "day", day: row.day }
        : { kind: "last_workday" },
  };
}

export function paydayColumns(rule: PaydayRule) {
  return rule.kind === "day"
    ? { kind: "day" as const, day: rule.day }
    : { kind: "last_workday" as const, day: null };
}
