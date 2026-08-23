import { eq } from "drizzle-orm";

import { localDateInTimeZone } from "@trove/domain/clock";
import type { SettlementIdentity } from "@trove/domain/settlement";

import { recurringRule } from "@trove/db/schema/recurring";

import type { CommandDatabase } from "../commands/types";
import { settleHouseholdRules, type HouseholdSettlementSummary } from "./settle-household";

/**
 * Synthetic change-log actor for system-driven sweeps (#88). The
 * `household_changes.user_id` column is plain text with no user FK, so
 * settlement-generated transactions are attributable to the scheduler
 * without inventing a real user row.
 */
export const SYSTEM_SETTLEMENT_ACTOR_ID = "user-system-settlement";

/**
 * Production identity for cron-driven sweeps: Workers provide
 * `crypto.randomUUID()` at runtime.
 */
export function createSettlementIdentity(): SettlementIdentity {
  return {
    next: (kind) => `sched:${kind}:${crypto.randomUUID()}`,
  };
}

/**
 * Households that own at least one active Recurring Rule — the fan-out set
 * for the hourly Cron Trigger. Iterating households (not all rules) in one
 * invocation keeps each sweep bounded, the Workers CPU-limit mitigation the
 * issue triage calls for; larger deployments can move this loop onto a queue.
 */
export async function listActiveRuleHouseholds(db: CommandDatabase): Promise<string[]> {
  const rows = await db
    .selectDistinct({ householdId: recurringRule.householdId })
    .from(recurringRule)
    .where(eq(recurringRule.lifecycle, "active"));
  return rows.map((row) => row.householdId);
}

export interface ScheduledSettlementSummary {
  /** Households the sweep fanned out over. */
  readonly households: number;
  readonly generatedCount: number;
  readonly totalMinor: number;
  readonly reports: HouseholdSettlementSummary[];
}

/**
 * Hourly settlement sweep across ALL households (#88). Every active Rule is
 * evaluated on its OWN time zone's local date — the same calendar the client
 * clock resolves — so a UTC+14 household settles hours before a UTC-11 one,
 * and no Rule is ever pulled ahead of its local today. Idempotent under Cron
 * Trigger retries: the occurrence identity PK absorbs double-settlement and
 * the revision assertion aborts commits racing a concurrent edit. One
 * failing household never blocks the rest of the fan-out.
 */
export async function settleDueRules(
  db: CommandDatabase,
  identity: SettlementIdentity,
  now: Date,
): Promise<ScheduledSettlementSummary> {
  const householdIds = await listActiveRuleHouseholds(db);

  let generatedCount = 0;
  let totalMinor = 0;
  const reports: HouseholdSettlementSummary[] = [];
  for (const householdId of [...householdIds].sort()) {
    try {
      const summary = await settleHouseholdRules(
        db,
        { householdId, userId: SYSTEM_SETTLEMENT_ACTOR_ID },
        identity,
        // Nominal label only; each Rule resolves its own local date below.
        localDateInTimeZone(now, "UTC"),
        now.toISOString(),
        { resolveLocalDate: (rule) => localDateInTimeZone(now, rule.timeZone) },
      );
      reports.push(summary);
      generatedCount += summary.generatedCount;
      totalMinor += summary.totalMinor;
    } catch (error) {
      console.error(`Settlement sweep failed for household ${householdId}:`, error);
    }
  }

  return { households: reports.length, generatedCount, totalMinor, reports };
}
