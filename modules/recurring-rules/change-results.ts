import { dateAfter, nextScheduledDateOnOrAfter } from "./calendar";
import { settlementEffects } from "./settlement";
import type {
  RecurringChangeResult,
  RecurringEffect,
  RecurringRule,
  RecurringRuleDraft,
} from "./types";

export function applied(
  ruleId: string,
  revision: number,
  generatedCount: number,
  totalMinor: number,
  effects: RecurringEffect[],
): RecurringChangeResult {
  return {
    kind: "applied",
    ruleId,
    revision,
    settlement: { generatedCount, totalMinor },
    effects,
  };
}

export function changeEffects(generatedCount: number): RecurringEffect[] {
  return generatedCount > 0 ? settlementEffects(generatedCount) : ["rules", "upcoming"];
}

export function staleResult(
  rule: RecurringRule | null,
  expectedRevision: number,
  ruleId: string,
): RecurringChangeResult | null {
  if (!rule) return { kind: "missing_rule", ruleId };
  if (rule.revision === expectedRevision) return null;
  return {
    kind: "stale_revision",
    ruleId,
    expectedRevision,
    actualRevision: rule.revision,
  };
}

export function invalidLifecycle(action: string, expected: string): RecurringChangeResult {
  return {
    kind: "invalid_intent",
    issues: [{ field: "rule", message: `${action} requires a ${expected} Rule.` }],
  };
}

export function candidateFromDraft(
  id: string,
  draft: RecurringRuleDraft,
  now: string,
): RecurringRule {
  return {
    id,
    ...draft,
    lifecycle: "active",
    health: "ready",
    attentionReasons: [],
    attentionDetails: null,
    eligibilityFloor: draft.startDate,
    revision: 1,
    lifecycleChangedAt: null,
    healthChangedAt: null,
    lastSettlementAttemptAt: null,
    lastSettlementError: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function candidateFromExisting(
  existing: RecurringRule,
  draft: RecurringRuleDraft,
  overrides: Partial<RecurringRule>,
): RecurringRule {
  return { ...existing, ...draft, ...overrides };
}

export function draftFromRule(rule: RecurringRule): RecurringRuleDraft {
  if (rule.amountMinor === null || rule.accountId === null) {
    throw new Error(`Recurring Rule ${rule.id} requires repair before ordinary editing.`);
  }
  return {
    name: rule.name,
    type: rule.type,
    amountMinor: rule.amountMinor,
    currency: rule.currency,
    accountId: rule.accountId,
    toAccountId: rule.toAccountId,
    categoryId: rule.categoryId,
    description: rule.description,
    frequency: rule.frequency,
    intervalCount: rule.intervalCount,
    startDate: rule.startDate,
    endDate: rule.endDate,
    endCount: rule.endCount,
    timeZone: rule.timeZone,
  };
}

export async function lifecycleAfterProspectiveEdit(
  database: import("expo-sqlite").SQLiteDatabase,
  current: RecurringRule,
  draft: RecurringRuleDraft,
  settledLifecycle: RecurringRule["lifecycle"],
  localDate: string,
): Promise<RecurringRule["lifecycle"]> {
  if (current.lifecycle === "paused" || current.lifecycle === "archived") {
    return current.lifecycle;
  }
  if (settledLifecycle !== "completed") return settledLifecycle;

  if (draft.endCount !== null) {
    const count = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM recurring_occurrences WHERE rule_id = ?",
      current.id,
    );
    if ((count?.count ?? 0) >= draft.endCount) return "completed";
  }
  const future = nextScheduledDateOnOrAfter(
    {
      startDate: draft.startDate,
      frequency: draft.frequency,
      intervalCount: draft.intervalCount,
      endDate: draft.endDate,
      endCount: null,
    },
    dateAfter(localDate),
  );
  return future ? "active" : "completed";
}
