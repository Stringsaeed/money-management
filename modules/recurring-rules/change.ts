import { changeRuleContent, type ContentChange } from "./change-content";
import { changeLifecycle, type LifecycleChange } from "./change-lifecycle";
import { applied, candidateFromDraft, staleResult } from "./change-results";
import type { ConfirmationStore } from "./confirmation";
import { insertRule, loadRule, runInTransaction } from "./persistence";
import { previewUnpersistedRule, settleRule, settlementEffects } from "./settlement";
import type { CreateRecurringRulesOptions, RecurringChange, RecurringChangeResult } from "./types";
import { validateDraft } from "./validation";

export async function changeRecurringRule(
  options: CreateRecurringRulesOptions,
  confirmations: ConfirmationStore,
  intent: RecurringChange,
): Promise<RecurringChangeResult> {
  if (intent.kind === "create") return createRule(options, confirmations, intent);

  const rule = await loadRule(options.database, intent.ruleId);
  if (!rule) return { kind: "missing_rule", ruleId: intent.ruleId };
  const stale = staleResult(rule, intent.expectedRevision, rule.id);
  if (stale) return stale;

  if (
    intent.kind === "pause" ||
    intent.kind === "resume" ||
    intent.kind === "archive" ||
    intent.kind === "restore"
  ) {
    return changeLifecycle(options, confirmations, rule, intent as LifecycleChange);
  }
  return changeRuleContent(options, confirmations, rule, intent as ContentChange);
}

async function createRule(
  options: CreateRecurringRulesOptions,
  confirmations: ConfirmationStore,
  intent: Extract<RecurringChange, { kind: "create" }>,
): Promise<RecurringChangeResult> {
  const issues = await validateDraft(options, intent.rule);
  if (issues.length > 0) return { kind: "invalid_intent", issues };

  const localDate = options.clock.localDate(intent.rule.timeZone);
  const candidate = candidateFromDraft(
    "unpersisted",
    intent.rule,
    options.clock.now().toISOString(),
  );
  const preview = previewUnpersistedRule(candidate, localDate);
  const confirmation = await confirmations.confirmOrPreview(intent, candidate, localDate, preview);
  if (confirmation) return confirmation;

  return runInTransaction(options.database, async (transaction): Promise<RecurringChangeResult> => {
    const transactionIssues = await validateDraft(
      { ...options, database: transaction },
      intent.rule,
    );
    if (transactionIssues.length > 0) return { kind: "invalid_intent", issues: transactionIssues };

    const now = options.clock.now().toISOString();
    const ruleId = options.identity.next("rule");
    await insertRule(transaction, ruleId, intent.rule, now);
    const rule = await loadRule(transaction, ruleId);
    if (!rule) throw new Error(`Created Recurring Rule ${ruleId} could not be reloaded.`);
    const settlement = await settleRule(
      transaction,
      rule,
      localDate,
      now,
      options.identity,
      "preserve",
    );
    return applied(
      ruleId,
      settlement.revision,
      settlement.generatedCount,
      settlement.totalMinor,
      settlementEffects(settlement.generatedCount),
    );
  });
}
