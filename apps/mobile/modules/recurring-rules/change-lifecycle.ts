import { dateAfter } from "@trove/domain/calendar";
import { applied, changeEffects, invalidLifecycle, staleResult } from "./change-results";
import type { ConfirmationStore } from "./confirmation";
import { loadRule, runInTransaction, updateRuleLifecycle } from "./persistence";
import { previewRule, settleRule } from "./settlement";
import type {
  CreateRecurringRulesOptions,
  RecurringChange,
  RecurringChangeResult,
  RecurringRule,
} from "./types";

export type LifecycleChange = Extract<
  RecurringChange,
  { kind: "pause" | "resume" | "archive" | "restore" }
>;

export async function changeLifecycle(
  options: CreateRecurringRulesOptions,
  confirmations: ConfirmationStore,
  rule: RecurringRule,
  intent: LifecycleChange,
): Promise<RecurringChangeResult> {
  if (intent.kind === "resume" || intent.kind === "restore") {
    return resumeOrRestore(options, rule, intent);
  }
  if (intent.kind === "pause" && rule.lifecycle !== "active") {
    return invalidLifecycle(intent.kind, "active");
  }
  if (intent.kind === "archive" && rule.lifecycle === "archived") {
    return invalidLifecycle(intent.kind, "active, paused, or completed");
  }

  const localDate = options.clock.localDate(rule.timeZone);
  const preview =
    rule.lifecycle === "active" && rule.health === "ready"
      ? await previewRule(options.database, rule, localDate)
      : null;
  const confirmation = await confirmations.confirmOrPreview(intent, rule, localDate, preview);
  if (confirmation) return confirmation;

  return runInTransaction(options.database, async (transaction): Promise<RecurringChangeResult> => {
    const current = await loadRule(transaction, rule.id);
    const stale = staleResult(current, intent.expectedRevision, rule.id);
    if (stale) return stale;
    if (!current) return { kind: "missing_rule", ruleId: rule.id };

    const now = options.clock.now().toISOString();
    const settlement = await settleRule(
      transaction,
      current,
      localDate,
      now,
      options.identity,
      "preserve",
    );
    const lifecycle = intent.kind === "pause" ? "paused" : "archived";
    await updateRuleLifecycle(
      transaction,
      rule.id,
      lifecycle,
      current.eligibilityFloor,
      intent.expectedRevision + 1,
      now,
    );
    return applied(
      rule.id,
      intent.expectedRevision + 1,
      settlement.generatedCount,
      settlement.totalMinor,
      changeEffects(settlement.generatedCount),
    );
  });
}

async function resumeOrRestore(
  options: CreateRecurringRulesOptions,
  rule: RecurringRule,
  intent: Extract<LifecycleChange, { kind: "resume" | "restore" }>,
): Promise<RecurringChangeResult> {
  const expectedLifecycle = intent.kind === "resume" ? "paused" : "archived";
  if (rule.lifecycle !== expectedLifecycle) {
    return invalidLifecycle(intent.kind, expectedLifecycle);
  }
  const localDate = options.clock.localDate(rule.timeZone);

  return runInTransaction(options.database, async (transaction): Promise<RecurringChangeResult> => {
    const current = await loadRule(transaction, rule.id);
    const stale = staleResult(current, intent.expectedRevision, rule.id);
    if (stale) return stale;
    const now = options.clock.now().toISOString();
    await updateRuleLifecycle(
      transaction,
      rule.id,
      "active",
      dateAfter(localDate),
      intent.expectedRevision + 1,
      now,
    );
    return applied(rule.id, intent.expectedRevision + 1, 0, 0, ["rules", "upcoming"]);
  });
}
