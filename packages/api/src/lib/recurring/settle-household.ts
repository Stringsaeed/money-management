import type { Effects } from "@trove/protocol";
import {
  settlementEffects,
  settleRule,
  type RuleSettlementResult,
  type SettleableRule,
  type SettlementIdentity,
} from "@trove/domain/settlement";

import { D1RecurringStore, listSettleableRules } from "./d1-store";
import type { CommandDatabase } from "../commands/types";

/**
 * Whole-household settlement sweep (#87): settles every non-archived rule in
 * deterministic (name, id) order — the client engine's ordering — each rule
 * committing atomically in its own batch. #88 wires this into a Workers
 * Cron Trigger per rule time zone.
 */
export interface HouseholdSettlementSummary {
  readonly localDate: string;
  readonly generatedCount: number;
  readonly totalMinor: number;
  readonly effects: Effects;
  readonly rules: readonly RuleSettlementResult[];
}

export interface HouseholdSweepOptions {
  /**
   * Per-rule local-date resolution (#88). When given, each Rule is evaluated
   * on its OWN time zone's calendar — matching the client runtime's
   * `clock.localDate(rule.timeZone)` — instead of the sweep-wide date.
   */
  readonly resolveLocalDate?: (rule: SettleableRule) => string;
}

export async function settleHouseholdRules(
  db: CommandDatabase,
  scope: { householdId: string; userId: string },
  identity: SettlementIdentity,
  localDate: string,
  now: string,
  options: HouseholdSweepOptions = {},
): Promise<HouseholdSettlementSummary> {
  const store = new D1RecurringStore(db, scope, () => identity.next("transaction"));
  const rules = await listSettleableRules(db, scope.householdId);

  let generatedCount = 0;
  let totalMinor = 0;
  const results: RuleSettlementResult[] = [];
  for (const rule of rules) {
    // A single failing rule must not block the rest of the sweep.
    try {
      const result = await settleRule(
        store,
        rule,
        options.resolveLocalDate?.(rule) ?? localDate,
        now,
        identity,
        "increment",
      );
      results.push(result);
      if (result.kind === "settled") {
        generatedCount += result.generatedCount;
        totalMinor += result.totalMinor;
      }
    } catch (error) {
      results.push({
        ruleId: rule.id,
        kind: "failed",
        generatedCount: 0,
        totalMinor: 0,
        lifecycle: rule.lifecycle,
        revision: rule.revision,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    localDate,
    generatedCount,
    totalMinor,
    effects: settlementEffects(generatedCount),
    rules: results,
  };
}
