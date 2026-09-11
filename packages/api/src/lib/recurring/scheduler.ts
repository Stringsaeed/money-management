import { eq } from "drizzle-orm";
import { isPersonalLedgerId } from "@trove/protocol";

import { localDateInTimeZone } from "@trove/domain/clock";
import type { SettlementIdentity } from "@trove/domain/settlement";

import { recurringRule } from "@trove/db/schema/recurring";

import type { CommandDatabase } from "../commands/types";
import { settleLedgerRules, type HouseholdSettlementSummary } from "./settle-household";

/**
 * Synthetic change-log actor for system-driven sweeps (#88): a real user row
 * seeded by migration 0005 (household_changes.user_id carries a user FK).
 * Cron-driven Generated Transactions are therefore attributable to the
 * scheduler and distinguishable from any human member's commands.
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
 * Ledgers that own at least one active Recurring Rule — the fan-out set
 * for the hourly Cron Trigger. Iterating ledgers (not all rules) in one
 * invocation keeps each sweep bounded, the Workers CPU-limit mitigation the
 * issue triage calls for; larger deployments can move this loop onto a queue.
 */
export async function listActiveRuleLedgers(db: CommandDatabase): Promise<string[]> {
  const rows = await db
    .selectDistinct({ ledgerId: recurringRule.ledgerId })
    .from(recurringRule)
    .where(eq(recurringRule.lifecycle, "active"));
  return rows.map((row) => row.ledgerId);
}

export interface ScheduledSettlementSummary {
  /** Ledgers the sweep fanned out over (personal + organization). */
  readonly households: number;
  readonly generatedCount: number;
  readonly totalMinor: number;
  readonly reports: HouseholdSettlementSummary[];
}

/**
 * Hourly settlement sweep across ALL ledgers (#88, #227). Every active Rule
 * is evaluated on its OWN time zone's local date — the same calendar the
 * client clock resolves — so a UTC+14 ledger settles hours before a UTC-11
 * one, and no Rule is ever pulled ahead of its local today. Idempotent under
 * Cron Trigger retries: the occurrence identity PK absorbs double-settlement
 * and the revision assertion aborts commits racing a concurrent edit. One
 * failing ledger never blocks the rest of the fan-out.
 */
export async function settleDueRules(
  db: CommandDatabase,
  identity: SettlementIdentity,
  now: Date,
): Promise<ScheduledSettlementSummary> {
  const ledgerIds = await listActiveRuleLedgers(db);

  let generatedCount = 0;
  let totalMinor = 0;
  const reports: HouseholdSettlementSummary[] = [];
  for (const ledgerId of [...ledgerIds].sort()) {
    try {
      const summary = await settleLedgerRules(
        db,
        {
          ledgerId,
          householdId: isPersonalLedgerId(ledgerId) ? null : ledgerId,
          userId: SYSTEM_SETTLEMENT_ACTOR_ID,
        },
        identity,
        // Nominal label only (UTC calendar date of `now`) — with per-rule
        // time zones a sweep-wide date would be misleading; every Rule
        // resolves its true local date via resolveLocalDate below.
        localDateInTimeZone(now, "UTC"),
        now.toISOString(),
        { resolveLocalDate: (rule) => localDateInTimeZone(now, rule.timeZone) },
      );
      reports.push(summary);
      generatedCount += summary.generatedCount;
      totalMinor += summary.totalMinor;
    } catch (error) {
      console.error(`Settlement sweep failed for ledger ${ledgerId}:`, error);
    }
  }

  return { households: reports.length, generatedCount, totalMinor, reports };
}
