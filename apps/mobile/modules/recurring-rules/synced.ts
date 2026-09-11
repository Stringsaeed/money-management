import { max } from "date-fns";

import { dateAfter, nextScheduledDateOnOrAfter } from "@trove/domain/calendar";
import type { CommandEnvelope } from "@trove/protocol";

import type { SyncedLedgerBinding } from "@/modules/ledger-data-source/provider";
import type { PowerSyncLedgerCollections } from "@/modules/ledger-db/collections";
import { commandMetadataFor } from "@/modules/powersync/command-metadata";
import type { PowerSyncRecurringRuleRow } from "@/modules/powersync/domain-types";
import { parseDate, toDateString } from "@/utils/date";

import type {
  RecurringAttentionReason,
  RecurringChange,
  RecurringChangeResult,
  RecurringRead,
  RecurringReadResult,
  RecurringRule,
  RecurringRuleDraft,
  RecurringRules,
  RecurringRulesClock,
  RecurringUpcomingItem,
  SettlementReport,
} from "./types";

interface SyncedRecurringRulesOptions {
  readonly collections: PowerSyncLedgerCollections;
  readonly binding: SyncedLedgerBinding;
  readonly userId: string;
  readonly clock: RecurringRulesClock;
  readonly nextId: () => string;
}

export const createSyncedRecurringRules = (
  options: SyncedRecurringRulesOptions,
): RecurringRules => ({
  read: (query) => read(options, query),
  change: (intent) => change(options, intent),
  settle: () => noOpSettlement(options.clock),
});

async function read(
  options: SyncedRecurringRulesOptions,
  query: RecurringRead,
): Promise<RecurringReadResult> {
  const rules = options.collections.recurringRules.toArray
    .filter((row) => row.ledger_id === options.binding.ledgerId)
    .map(mapRule)
    .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
  if (query.kind === "detail") {
    return { kind: "detail", rule: rules.find((rule) => rule.id === query.ruleId) ?? null };
  }
  if (query.kind === "list") {
    const filter = query.filter ?? "current";
    return {
      kind: "list",
      rules: rules.filter((rule) => {
        if (filter === "archived") return rule.lifecycle === "archived";
        if (filter === "needs_attention") return rule.health === "needs_attention";
        return rule.lifecycle !== "archived";
      }),
    };
  }
  return { kind: "upcoming", items: upcoming(options, rules, query.limit ?? 3) };
}

function upcoming(
  options: SyncedRecurringRulesOptions,
  rules: readonly RecurringRule[],
  limit: number,
): RecurringUpcomingItem[] {
  const occurrences = options.collections.recurringOccurrences.toArray.filter(
    (row) => row.ledger_id === options.binding.ledgerId,
  );
  const items: RecurringUpcomingItem[] = [];
  for (const rule of rules) {
    if (rule.lifecycle !== "active" || rule.health !== "ready") continue;
    if (
      rule.endCount !== null &&
      occurrences.filter((occurrence) => occurrence.rule_id === rule.id).length >= rule.endCount
    ) {
      continue;
    }
    const floor = max([
      parseDate(dateAfter(options.clock.localDate(rule.timeZone))),
      parseDate(rule.eligibilityFloor),
    ]);
    const scheduledDate = nextScheduledDateOnOrAfter(
      {
        startDate: rule.startDate,
        frequency: rule.frequency,
        intervalCount: rule.intervalCount,
        endDate: rule.endDate,
        endCount: null,
      },
      toDateString(floor),
    );
    if (scheduledDate) items.push({ rule, scheduledDate });
  }
  return items
    .sort(
      (left, right) =>
        left.scheduledDate.localeCompare(right.scheduledDate) ||
        left.rule.name.localeCompare(right.rule.name),
    )
    .slice(0, limit);
}

async function change(
  options: SyncedRecurringRulesOptions,
  intent: RecurringChange,
): Promise<RecurringChangeResult> {
  if (intent.kind === "create") return create(options, intent.rule);
  const existing = options.collections.recurringRules.get(intent.ruleId);
  if (!existing || existing.ledger_id !== options.binding.ledgerId) {
    return { kind: "missing_rule", ruleId: intent.ruleId };
  }
  if (existing.revision !== intent.expectedRevision) {
    return {
      kind: "stale_revision",
      ruleId: intent.ruleId,
      expectedRevision: intent.expectedRevision,
      actualRevision: existing.revision,
    };
  }
  const command = commandFor(options, intent);
  const revision = existing.revision + 1;
  await options.collections.recurringRules.update(
    existing.id,
    { metadata: commandMetadataFor(command) },
    (row) => applyChange(row, intent, revision, options.clock.now().toISOString(), options.userId),
  ).isPersisted.promise;
  return applied(existing.id, revision);
}

async function create(
  options: SyncedRecurringRulesOptions,
  draft: RecurringRuleDraft,
): Promise<RecurringChangeResult> {
  const ruleId = options.nextId();
  const now = options.clock.now().toISOString();
  const command: CommandEnvelope = {
    commandId: options.nextId(),
    scope: options.binding.scope,
    householdId: options.binding.householdId ?? undefined,
    kind: "recurring.change",
    issuedAt: now,
    payload: { action: "create", ruleId, rule: draft },
  };
  await options.collections.recurringRules.insert(
    {
      id: ruleId,
      ledger_id: options.binding.ledgerId,
      household_id: options.binding.householdId,
      ...draftRow(draft),
      lifecycle: "active",
      health: "ready",
      attention_reasons: "[]",
      attention_details: null,
      eligibility_floor: draft.startDate,
      revision: 1,
      lifecycle_changed_at: null,
      health_changed_at: null,
      last_settlement_attempt_at: null,
      last_settlement_error: null,
      created_by: options.userId,
      updated_by: options.userId,
      created_at: now,
      updated_at: now,
    },
    { metadata: commandMetadataFor(command) },
  ).isPersisted.promise;
  return applied(ruleId, 1);
}

function commandFor(
  options: SyncedRecurringRulesOptions,
  intent: Exclude<RecurringChange, { kind: "create" }>,
): CommandEnvelope {
  const payload =
    intent.kind === "edit" || intent.kind === "repair"
      ? {
          action: intent.kind,
          ruleId: intent.ruleId,
          expectedRevision: intent.expectedRevision,
          rule: intent.rule,
        }
      : intent.kind === "change_time_zone"
        ? {
            action: intent.kind,
            ruleId: intent.ruleId,
            expectedRevision: intent.expectedRevision,
            timeZone: intent.timeZone,
          }
        : {
            action: intent.kind,
            ruleId: intent.ruleId,
            expectedRevision: intent.expectedRevision,
          };
  return {
    commandId: options.nextId(),
    scope: options.binding.scope,
    householdId: options.binding.householdId ?? undefined,
    kind: "recurring.change",
    issuedAt: options.clock.now().toISOString(),
    payload,
  };
}

function applyChange(
  row: PowerSyncRecurringRuleRow,
  intent: Exclude<RecurringChange, { kind: "create" }>,
  revision: number,
  now: string,
  userId: string,
): void {
  if (intent.kind === "edit" || intent.kind === "repair") {
    Object.assign(row, draftRow(intent.rule));
    if (intent.kind === "repair") {
      row.health = "ready";
      row.attention_reasons = "[]";
      row.attention_details = null;
      row.health_changed_at = now;
    }
  } else if (intent.kind === "change_time_zone") {
    row.time_zone = intent.timeZone;
  } else {
    row.lifecycle =
      intent.kind === "pause" ? "paused" : intent.kind === "archive" ? "archived" : "active";
    row.lifecycle_changed_at = now;
  }
  row.revision = revision;
  row.updated_by = userId;
  row.updated_at = now;
}

const draftRow = (draft: RecurringRuleDraft) => ({
  name: draft.name,
  type: draft.type,
  amount_minor: draft.amountMinor,
  currency: draft.currency,
  account_id: draft.accountId,
  to_account_id: draft.toAccountId,
  category_id: draft.categoryId,
  description: draft.description,
  frequency: draft.frequency,
  interval_count: draft.intervalCount,
  start_date: draft.startDate,
  end_date: draft.endDate,
  end_count: draft.endCount,
  time_zone: draft.timeZone,
});

function mapRule(row: PowerSyncRecurringRuleRow): RecurringRule {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    amountMinor: row.amount_minor,
    currency: row.currency,
    accountId: row.account_id,
    toAccountId: row.to_account_id,
    categoryId: row.category_id,
    description: row.description,
    frequency: row.frequency,
    intervalCount: row.interval_count,
    startDate: row.start_date,
    endDate: row.end_date,
    endCount: row.end_count,
    timeZone: row.time_zone,
    lifecycle: row.lifecycle,
    health: row.health,
    attentionReasons: parseJson<RecurringAttentionReason[]>(row.attention_reasons, []),
    attentionDetails: row.attention_details
      ? parseJson<Record<string, unknown>>(row.attention_details, {})
      : null,
    eligibilityFloor: row.eligibility_floor,
    revision: row.revision,
    lifecycleChangedAt: row.lifecycle_changed_at,
    healthChangedAt: row.health_changed_at,
    lastSettlementAttemptAt: row.last_settlement_attempt_at,
    lastSettlementError: row.last_settlement_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const applied = (ruleId: string, revision: number): RecurringChangeResult => ({
  kind: "applied",
  ruleId,
  revision,
  settlement: { generatedCount: 0, totalMinor: 0 },
  effects: ["rules", "upcoming"],
});

const noOpSettlement = async (clock: RecurringRulesClock): Promise<SettlementReport> => {
  const now = clock.now().toISOString();
  return {
    localDate: toDateString(clock.now()),
    startedAt: now,
    finishedAt: now,
    generatedCount: 0,
    totalMinor: 0,
    rules: [],
    effects: [],
  };
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
