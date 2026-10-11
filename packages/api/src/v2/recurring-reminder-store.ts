import { and, eq, inArray, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import type { RuleSettlementCommit } from "@trove/domain/settlement";
import { v2RecurringOccurrence, v2RecurringRule } from "@trove/db/schema/v2-ledger";

import { storeFailure } from "./budget-errors";
import { BudgetLedger, LedgerDb } from "./budget-services";
import { applySettlementCommit, validateRuleDependencies } from "./recurring";
import { safeMinor, type V2DbExecutor } from "./shared";

/**
 * Bill reminders (#372) over the V2 Recurring Rule tables. The rule and its
 * occurrences stay the system of record; Mark paid writes through the same
 * settlement commit the auto-post cron uses.
 */

export type RuleRow = typeof v2RecurringRule.$inferSelect;
export type RuleLifecycle = RuleRow["lifecycle"];

const make = Effect.gen(function* () {
  const db = yield* LedgerDb;
  const ledger = yield* BudgetLedger;
  const { ledgerId } = ledger;
  const run = <A>(operation: string, query: (db: V2DbExecutor) => PromiseLike<A>) =>
    Effect.tryPromise({ try: () => query(db), catch: storeFailure(operation) });

  return {
    findRule: (ruleId: string) =>
      run("reminders.findRule", async (db) => {
        const rows = await db
          .select()
          .from(v2RecurringRule)
          .where(and(eq(v2RecurringRule.ledgerId, ledgerId), eq(v2RecurringRule.id, ruleId)))
          .limit(1);
        return rows[0] && decodeRule(rows[0]);
      }),

    /** Every paid or skipped date of one rule. */
    recordedOccurrences: (ruleId: string) =>
      run("reminders.recordedOccurrences", (db) =>
        db
          .select({
            scheduledDate: v2RecurringOccurrence.scheduledDate,
            status: v2RecurringOccurrence.status,
          })
          .from(v2RecurringOccurrence)
          .where(
            and(
              eq(v2RecurringOccurrence.ledgerId, ledgerId),
              eq(v2RecurringOccurrence.ruleId, ruleId),
            ),
          ),
      ),

    activeReminderRules: run("reminders.activeReminderRules", async (db) => {
      const rows = await db
        .select()
        .from(v2RecurringRule)
        .where(
          and(
            eq(v2RecurringRule.ledgerId, ledgerId),
            eq(v2RecurringRule.lifecycle, "active"),
            eq(v2RecurringRule.mode, "remind"),
          ),
        );
      return rows.map(decodeRule);
    }),

    recordedDatesOf: (ruleIds: readonly string[]) =>
      run("reminders.recordedDatesOf", (db) =>
        db
          .select({
            ruleId: v2RecurringOccurrence.ruleId,
            scheduledDate: v2RecurringOccurrence.scheduledDate,
          })
          .from(v2RecurringOccurrence)
          .where(
            and(
              eq(v2RecurringOccurrence.ledgerId, ledgerId),
              inArray(v2RecurringOccurrence.ruleId, [...ruleIds]),
            ),
          ),
      ),

    /** The Recurring Rule account, category, and currency checks of the V2 routes. */
    validateRule: (rule: Parameters<typeof validateRuleDependencies>[2]) =>
      run("reminders.validateRule", (db) => validateRuleDependencies(db, ledgerId, rule)),

    /** Generated Transaction, its occurrence, and the rule update, as one settlement commit. */
    settle: (commit: RuleSettlementCommit) =>
      run("reminders.settle", (db) => applySettlementCommit(db, ledgerId, ledger.ownerId, commit)),

    recordSkip: (rule: RuleRow, scheduledDate: string, lifecycle: RuleLifecycle, now: Date) =>
      run("reminders.recordSkip", async (db) => {
        await db.insert(v2RecurringOccurrence).values({
          id: crypto.randomUUID(),
          ledgerId,
          ruleId: rule.id,
          scheduledDate,
          status: "skipped",
          transactionId: null,
          settledAt: now,
        });
        await db
          .update(v2RecurringRule)
          .set({
            lifecycle,
            revision: rule.revision + 1,
            updatedBy: ledger.ownerId,
            updatedAt: now,
          })
          .where(and(eq(v2RecurringRule.ledgerId, ledgerId), eq(v2RecurringRule.id, rule.id)));
      }),

    /**
     * Budget activation (#372 decision): active expense rules whose Category
     * maps to a Bills envelope stop auto-posting and become reminders.
     */
    remindBillRules: (billCategoryIds: readonly string[]) =>
      run("reminders.remindBillRules", async (db) => {
        if (billCategoryIds.length === 0) return;
        await db
          .update(v2RecurringRule)
          .set({
            mode: "remind",
            revision: sql`${v2RecurringRule.revision} + 1`,
            updatedBy: ledger.ownerId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(v2RecurringRule.ledgerId, ledgerId),
              eq(v2RecurringRule.kind, "expense"),
              eq(v2RecurringRule.lifecycle, "active"),
              eq(v2RecurringRule.mode, "auto_post"),
              inArray(v2RecurringRule.categoryId, [...billCategoryIds]),
            ),
          );
      }),
  };
});

/** Money read back must be a safe integer; `safeMinor` refuses anything else. */
function decodeRule(row: RuleRow): RuleRow {
  return { ...row, amountMinor: safeMinor(row.amountMinor, "Recurring amount") };
}

export class ReminderStore extends Context.Service<ReminderStore, Effect.Success<typeof make>>()(
  "@trove/api/v2/ReminderStore",
) {
  static readonly layer = Layer.effect(ReminderStore, make);
}
