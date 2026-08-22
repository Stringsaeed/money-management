import { dateAfter } from "@trove/domain/calendar";
import {
  applied,
  candidateFromExisting,
  changeEffects,
  draftFromRule,
  lifecycleAfterProspectiveEdit,
  staleResult,
} from "./change-results";
import type { ConfirmationStore } from "./confirmation";
import { loadRule, runInTransaction, updateRuleDraft } from "./persistence";
import { previewRule, settleRule } from "./settlement";
import type {
  CreateRecurringRulesOptions,
  RecurringChange,
  RecurringChangeResult,
  RecurringRule,
  RecurringRuleDraft,
} from "./types";
import { validateDraft } from "./validation";

export type ContentChange = Extract<
  RecurringChange,
  { kind: "edit" | "repair" | "change_time_zone" }
>;

export async function changeRuleContent(
  options: CreateRecurringRulesOptions,
  confirmations: ConfirmationStore,
  rule: RecurringRule,
  intent: ContentChange,
): Promise<RecurringChangeResult> {
  if (intent.kind === "repair") {
    return repairRule(options, confirmations, rule, intent);
  }
  if (rule.health !== "ready") {
    return { kind: "needs_attention", ruleId: rule.id, reasons: rule.attentionReasons };
  }

  const nextDraft =
    intent.kind === "edit" ? intent.rule : { ...draftFromRule(rule), timeZone: intent.timeZone };
  const issues = await validateDraft(options, nextDraft);
  if (issues.length > 0) return { kind: "invalid_intent", issues };

  const localDate = options.clock.localDate(rule.timeZone);
  const preview =
    rule.lifecycle === "active" ? await previewRule(options.database, rule, localDate) : null;
  const confirmation = await confirmations.confirmOrPreview(intent, rule, localDate, preview);
  if (confirmation) return confirmation;
  return applyProspectiveEdit(options, rule, intent, nextDraft, localDate);
}

async function repairRule(
  options: CreateRecurringRulesOptions,
  confirmations: ConfirmationStore,
  rule: RecurringRule,
  intent: Extract<ContentChange, { kind: "repair" }>,
): Promise<RecurringChangeResult> {
  if (rule.health !== "needs_attention") {
    return {
      kind: "invalid_intent",
      issues: [{ field: "rule", message: "Only a Rule that Needs Attention can be repaired." }],
    };
  }
  const issues = await validateDraft(options, intent.rule);
  if (issues.length > 0) return { kind: "invalid_intent", issues };

  const localDate = options.clock.localDate(intent.rule.timeZone);
  const candidate = candidateFromExisting(rule, intent.rule, {
    health: "ready",
    attentionReasons: [],
  });
  const preview =
    candidate.lifecycle === "active"
      ? await previewRule(options.database, candidate, localDate)
      : null;
  const confirmation = await confirmations.confirmOrPreview(intent, candidate, localDate, preview);
  if (confirmation) return confirmation;

  return runInTransaction(options.database, async (transaction): Promise<RecurringChangeResult> => {
    const current = await loadRule(transaction, rule.id);
    const stale = staleResult(current, intent.expectedRevision, rule.id);
    if (stale) return stale;
    if (!current) return { kind: "missing_rule", ruleId: rule.id };
    const transactionIssues = await validateDraft(
      { ...options, database: transaction },
      intent.rule,
    );
    if (transactionIssues.length > 0) return { kind: "invalid_intent", issues: transactionIssues };

    const now = options.clock.now().toISOString();
    await updateRuleDraft(transaction, rule.id, intent.rule, {
      lifecycle: current.lifecycle,
      health: "ready",
      attentionReasons: [],
      eligibilityFloor: current.eligibilityFloor,
      revision: current.revision,
      now,
      lifecycleChangedAt: current.lifecycleChangedAt,
      healthChangedAt: now,
    });
    const repaired = await loadRule(transaction, rule.id);
    if (!repaired) throw new Error(`Repaired Recurring Rule ${rule.id} could not be reloaded.`);
    const settlement = await settleRule(
      transaction,
      repaired,
      localDate,
      now,
      options.identity,
      "preserve",
    );
    await updateRuleDraft(transaction, rule.id, intent.rule, {
      lifecycle: settlement.lifecycle,
      health: "ready",
      attentionReasons: [],
      eligibilityFloor: current.eligibilityFloor,
      revision: intent.expectedRevision + 1,
      now,
      lifecycleChangedAt:
        settlement.lifecycle === current.lifecycle ? current.lifecycleChangedAt : now,
      healthChangedAt: now,
    });
    return applied(
      rule.id,
      intent.expectedRevision + 1,
      settlement.generatedCount,
      settlement.totalMinor,
      changeEffects(settlement.generatedCount),
    );
  });
}

async function applyProspectiveEdit(
  options: CreateRecurringRulesOptions,
  rule: RecurringRule,
  intent: Exclude<ContentChange, { kind: "repair" }>,
  nextDraft: RecurringRuleDraft,
  localDate: string,
): Promise<RecurringChangeResult> {
  return runInTransaction(options.database, async (transaction): Promise<RecurringChangeResult> => {
    const current = await loadRule(transaction, rule.id);
    const stale = staleResult(current, intent.expectedRevision, rule.id);
    if (stale) return stale;
    if (!current) return { kind: "missing_rule", ruleId: rule.id };
    const transactionIssues = await validateDraft({ ...options, database: transaction }, nextDraft);
    if (transactionIssues.length > 0) return { kind: "invalid_intent", issues: transactionIssues };

    const now = options.clock.now().toISOString();
    const settlement = await settleRule(
      transaction,
      current,
      localDate,
      now,
      options.identity,
      "preserve",
    );
    const prospectiveLocalDate = options.clock.localDate(nextDraft.timeZone);
    const lifecycle = await lifecycleAfterProspectiveEdit(
      transaction,
      current,
      nextDraft,
      settlement.lifecycle,
      prospectiveLocalDate,
    );
    await updateRuleDraft(transaction, rule.id, nextDraft, {
      lifecycle,
      health: "ready",
      attentionReasons: [],
      eligibilityFloor: dateAfter(prospectiveLocalDate),
      revision: intent.expectedRevision + 1,
      now,
      lifecycleChangedAt: lifecycle === current.lifecycle ? current.lifecycleChangedAt : now,
      healthChangedAt: current.healthChangedAt,
    });
    return applied(
      rule.id,
      intent.expectedRevision + 1,
      settlement.generatedCount,
      settlement.totalMinor,
      changeEffects(settlement.generatedCount),
    );
  });
}
