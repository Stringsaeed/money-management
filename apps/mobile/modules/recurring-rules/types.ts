import type { TransactionType } from "@/types";

import type { RecurringRuleFrequency } from "@trove/domain/calendar";

export type RecurringRuleLifecycle = "active" | "paused" | "archived" | "completed";
export type RecurringRuleHealth = "ready" | "needs_attention";
export type RecurringEffect = "rules" | "upcoming" | "ledger" | "balances" | "summaries";

export type RecurringAttentionReason =
  | { kind: "missing-source-account"; formerAccountId: string | null }
  | { kind: "missing-destination-account"; formerAccountId: string | null }
  | { kind: "account-currency-changed"; accountId: string; expected: string; actual: string }
  | { kind: "invalid-legacy-amount" }
  | { kind: "invalid-legacy-cadence" }
  | { kind: "archived-category"; categoryId: string }
  | { kind: "settlement-failed"; message: string };

export interface RecurringRuleDraft {
  name: string;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  frequency: RecurringRuleFrequency;
  intervalCount: number;
  startDate: string;
  endDate: string | null;
  endCount: number | null;
  timeZone: string;
}

export interface RecurringRule extends Omit<RecurringRuleDraft, "amountMinor" | "accountId"> {
  id: string;
  amountMinor: number | null;
  accountId: string | null;
  lifecycle: RecurringRuleLifecycle;
  health: RecurringRuleHealth;
  attentionReasons: RecurringAttentionReason[];
  attentionDetails: Record<string, unknown> | null;
  eligibilityFloor: string;
  revision: number;
  lifecycleChangedAt: string | null;
  healthChangedAt: string | null;
  lastSettlementAttemptAt: string | null;
  lastSettlementError: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecurringRead =
  | { kind: "list"; filter?: "current" | "archived" | "needs_attention" }
  | { kind: "detail"; ruleId: string }
  | { kind: "upcoming"; limit?: number };

export interface RecurringUpcomingItem {
  rule: RecurringRule;
  scheduledDate: string;
}

export type RecurringReadResult =
  | { kind: "list"; rules: RecurringRule[] }
  | { kind: "detail"; rule: RecurringRule | null }
  | { kind: "upcoming"; items: RecurringUpcomingItem[] };

interface ConfirmableChange {
  confirmationToken?: string;
}

export type RecurringChange =
  | ({ kind: "create"; rule: RecurringRuleDraft } & ConfirmableChange)
  | ({
      kind: "edit";
      ruleId: string;
      expectedRevision: number;
      rule: RecurringRuleDraft;
    } & ConfirmableChange)
  | ({ kind: "pause"; ruleId: string; expectedRevision: number } & ConfirmableChange)
  | ({ kind: "archive"; ruleId: string; expectedRevision: number } & ConfirmableChange)
  | { kind: "resume"; ruleId: string; expectedRevision: number }
  | { kind: "restore"; ruleId: string; expectedRevision: number }
  | ({
      kind: "repair";
      ruleId: string;
      expectedRevision: number;
      rule: RecurringRuleDraft;
    } & ConfirmableChange)
  | ({
      kind: "change_time_zone";
      ruleId: string;
      expectedRevision: number;
      timeZone: string;
    } & ConfirmableChange);

export interface RecurringPreview {
  count: number;
  totalMinor: number;
  currency: string;
  firstDate: string;
  lastDate: string;
}

export interface RecurringValidationIssue {
  field: keyof RecurringRuleDraft | "rule";
  message: string;
}

export type RecurringChangeResult =
  | {
      kind: "applied";
      ruleId: string;
      revision: number;
      settlement: { generatedCount: number; totalMinor: number };
      effects: RecurringEffect[];
    }
  | { kind: "preview_required"; confirmationToken: string; preview: RecurringPreview }
  | { kind: "invalid_intent"; issues: RecurringValidationIssue[] }
  | { kind: "stale_revision"; ruleId: string; expectedRevision: number; actualRevision: number }
  | { kind: "missing_rule"; ruleId: string }
  | { kind: "needs_attention"; ruleId: string; reasons: RecurringAttentionReason[] };

export interface SettlementRuleReport {
  ruleId: string;
  kind: "settled" | "not_due" | "needs_attention" | "ineligible" | "failed";
  generatedCount: number;
  totalMinor: number;
  error?: string;
}

export interface SettlementReport {
  localDate: string;
  startedAt: string;
  finishedAt: string;
  generatedCount: number;
  totalMinor: number;
  rules: SettlementRuleReport[];
  effects: RecurringEffect[];
}

export interface RecurringRulesClock {
  now(): Date;
  localDate(timeZone: string): string;
}

export interface RecurringRulesIdentity {
  next(kind: "rule" | "transaction" | "confirmation"): string;
}

export interface CreateRecurringRulesOptions {
  database: import("@/db/sqlite").SQLiteDatabase;
  clock: RecurringRulesClock;
  identity: RecurringRulesIdentity;
}

export interface RecurringRules {
  read(query: RecurringRead): Promise<RecurringReadResult>;
  change(intent: RecurringChange): Promise<RecurringChangeResult>;
  settle(): Promise<SettlementReport>;
}
