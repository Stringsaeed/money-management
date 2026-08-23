/**
 * Recurring-rule settlement engine (#87), ported from the client's
 * `modules/recurring-rules/settlement.ts` as pure functions over an injected
 * persistence store — no I/O, no driver imports, Node- and Workers-safe.
 *
 * Invariants preserved from the client engine (architecture doc invariant 13):
 * - Occurrence identity `(rule_id, scheduled_date)` is the double-settlement
 *   guard: a deleted generated Transaction never re-settles.
 * - Eligibility Floor is the only progress cursor.
 * - Rule Revision is the optimistic-concurrency version column; the adapter's
 *   commit must fail when the revision moved between read and write.
 * - Settlement applies a rule's pre-change state before a same-day
 *   pause/archive/edit takes effect.
 *
 * Atomicity contract: `SettlementStore.commitRuleSettlement` receives the
 * WHOLE rule outcome (generated transactions + occurrences + rule update) and
 * must apply it in one atomic batch (D1 single-writer makes that serializable).
 */

import type { EffectTag, Effects } from "@trove/protocol" with { "resolution-mode": "import" };
import { dateAfter, nextScheduledDateOnOrAfter, scheduledDatesThrough } from "./calendar";

export type RecurringRuleType = "expense" | "income" | "transfer";
export type RecurringFrequency = "day" | "week" | "month" | "year";
export type RecurringLifecycle = "active" | "paused" | "completed" | "archived";
export type RecurringHealth = "ready" | "needs_attention";

/** The subset of a persisted rule the settlement engine reads. */
export interface SettleableRule {
  readonly id: string;
  readonly name: string;
  readonly type: RecurringRuleType;
  readonly amountMinor: number | null;
  readonly currency: string;
  readonly accountId: string | null;
  readonly toAccountId: string | null;
  readonly categoryId: string | null;
  readonly description: string;
  readonly frequency: RecurringFrequency;
  readonly intervalCount: number;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly endCount: number | null;
  readonly lifecycle: RecurringLifecycle;
  readonly health: RecurringHealth;
  readonly eligibilityFloor: string;
  readonly revision: number;
  /**
   * IANA time zone the Rule's cadence is evaluated in (#88). The scheduler
   * resolves each Rule's local date from this — never from the host clock.
   */
  readonly timeZone: string;
}

export interface SettlementAttentionReason {
  readonly kind:
    | "missing-source-account"
    | "missing-destination-account"
    | "account-currency-changed";
  /** Client-contract field name for missing accounts (parity with the app). */
  readonly formerAccountId?: string | null;
  readonly accountId?: string | null;
  readonly expected?: string;
  readonly actual?: string;
}

export interface GeneratedTransaction {
  readonly transactionId: string;
  readonly type: RecurringRuleType;
  readonly amountMinor: number;
  readonly currency: string;
  readonly date: string;
  readonly accountId: string | null;
  readonly toAccountId: string | null;
  readonly categoryId: string | null;
  readonly description: string;
}

export interface RuleSettlementCommit {
  readonly ruleId: string;
  /** Expected revision — the commit must abort if the row no longer matches. */
  readonly expectedRevision: number;
  readonly nextRevision: number;
  readonly lifecycle: RecurringLifecycle;
  readonly lifecycleChanged: boolean;
  readonly health: RecurringHealth;
  readonly attentionReasonsJson: string | null;
  readonly generated: readonly GeneratedTransaction[];
  readonly settledDates: readonly string[];
  readonly now: string;
}

/**
 * Persistence seam consumed by the pure engine. The D1 adapter implements
 * every write of `commitRuleSettlement` inside one atomic batch.
 */
export interface SettlementStore {
  getAccountCurrency(accountId: string): Promise<string | null>;
  getSettledDates(ruleId: string): Promise<string[]>;
  commitRuleSettlement(commit: RuleSettlementCommit): Promise<void>;
}

export interface SettlementIdentity {
  next(kind: "transaction"): string;
}

export type SettlementKind =
  | "settled"
  | "not_due"
  | "needs_attention"
  | "ineligible"
  /** The rule's atomic commit failed mid-sweep; other rules continue. */
  | "failed";

export interface RuleSettlementResult {
  readonly ruleId: string;
  readonly kind: SettlementKind;
  readonly generatedCount: number;
  readonly totalMinor: number;
  readonly lifecycle: RecurringLifecycle;
  readonly revision: number;
  readonly attentionReasons?: readonly SettlementAttentionReason[];
  /** Present only when kind === "failed". */
  readonly error?: string;
}

/** Occurrences this rule still owes on or before `localDate`. */
export function pendingDatesFrom(
  rule: SettleableRule,
  localDate: string,
  existingDates: readonly string[],
): string[] {
  const existing = new Set(existingDates);
  const dates = scheduledDatesThrough(
    {
      startDate: rule.startDate,
      frequency: rule.frequency,
      intervalCount: rule.intervalCount,
      endDate: rule.endDate,
      endCount: null,
    },
    localDate,
  ).filter((date) => date >= rule.eligibilityFloor && !existing.has(date));

  if (rule.endCount === null) return dates;
  return dates.slice(0, Math.max(0, rule.endCount - existingDates.length));
}

/** Lifecycle the rule transitions to after settling through `localDate`. */
export function lifecycleAfterSettlement(
  rule: SettleableRule,
  localDate: string,
  settledCountAfter: number,
): RecurringLifecycle {
  if (rule.endCount !== null && settledCountAfter >= rule.endCount) {
    return "completed";
  }
  if (rule.endDate) {
    const future = nextScheduledDateOnOrAfter(
      {
        startDate: rule.startDate,
        frequency: rule.frequency,
        intervalCount: rule.intervalCount,
        endDate: rule.endDate,
        endCount: null,
      },
      dateAfter(localDate),
    );
    if (future === null) return "completed";
  }
  return rule.lifecycle;
}

/** Dependency attention checks: accounts exist and currencies still match. */
export async function dependencyAttentionReasons(
  store: Pick<SettlementStore, "getAccountCurrency">,
  rule: Pick<SettleableRule, "type" | "currency" | "accountId" | "toAccountId">,
): Promise<SettlementAttentionReason[]> {
  const reasons: SettlementAttentionReason[] = [];
  const sourceCurrency = rule.accountId ? await store.getAccountCurrency(rule.accountId) : null;
  if (!sourceCurrency) {
    reasons.push({ kind: "missing-source-account", formerAccountId: rule.accountId });
  } else if (sourceCurrency !== rule.currency) {
    reasons.push({
      kind: "account-currency-changed",
      accountId: rule.accountId,
      expected: rule.currency,
      actual: sourceCurrency,
    });
  }

  if (rule.type === "transfer") {
    const destinationCurrency = rule.toAccountId
      ? await store.getAccountCurrency(rule.toAccountId)
      : null;
    if (!destinationCurrency) {
      reasons.push({ kind: "missing-destination-account", formerAccountId: rule.toAccountId });
    } else if (destinationCurrency !== rule.currency) {
      reasons.push({
        kind: "account-currency-changed",
        accountId: rule.toAccountId,
        expected: rule.currency,
        actual: destinationCurrency,
      });
    }
  }

  return reasons;
}

/** Effect tags a settlement pass invalidates, by whether it generated anything. */
export const settlementEffects = (generatedCount: number): Effects =>
  generatedCount > 0 ? ["rules", "upcoming", "ledger", "balances", "summaries"] : ["rules"];
export type { EffectTag };

function report(
  rule: SettleableRule,
  kind: SettlementKind,
  generatedCount: number,
  totalMinor: number,
): RuleSettlementResult {
  return {
    ruleId: rule.id,
    kind,
    generatedCount,
    totalMinor,
    lifecycle: rule.lifecycle,
    revision: rule.revision,
  };
}

/**
 * Settles one rule: computes pending occurrences from durable facts and hands
 * the whole outcome to the store for atomic application. Idempotent across
 * repeated invocations — already-settled dates are filtered out first.
 */
export async function settleRule(
  store: SettlementStore,
  rule: SettleableRule,
  localDate: string,
  now: string,
  identity: SettlementIdentity,
  revisionMode: "increment" | "preserve",
): Promise<RuleSettlementResult> {
  if (rule.lifecycle !== "active") {
    return report(rule, "ineligible", 0, 0);
  }
  if (rule.health !== "ready" || rule.amountMinor === null || rule.accountId === null) {
    return report(rule, "needs_attention", 0, 0);
  }

  const dependencyReasons = await dependencyAttentionReasons(store, rule);
  if (dependencyReasons.length > 0) {
    await store.commitRuleSettlement({
      ruleId: rule.id,
      expectedRevision: rule.revision,
      nextRevision: rule.revision + 1,
      lifecycle: rule.lifecycle,
      lifecycleChanged: false,
      health: "needs_attention",
      attentionReasonsJson: JSON.stringify(dependencyReasons),
      generated: [],
      settledDates: [],
      now,
    });
    return {
      ...report(rule, "needs_attention", 0, 0),
      revision: rule.revision + 1,
      attentionReasons: dependencyReasons,
    };
  }

  const settledDates = await store.getSettledDates(rule.id);
  const pending = pendingDatesFrom(rule, localDate, settledDates);

  const generated: GeneratedTransaction[] = pending.map((scheduledDate) => ({
    transactionId: identity.next("transaction"),
    type: rule.type,
    amountMinor: rule.amountMinor as number,
    currency: rule.currency,
    date: scheduledDate,
    accountId: rule.accountId,
    toAccountId: rule.toAccountId,
    categoryId: rule.categoryId,
    description: rule.description || rule.name,
  }));

  const settledCountAfter =
    settledDates.length + (rule.endCount === null ? 0 : Math.min(pending.length, rule.endCount));
  const lifecycle = lifecycleAfterSettlement(rule, localDate, settledCountAfter);
  const changed = pending.length > 0 || lifecycle !== rule.lifecycle;
  const revision = revisionMode === "increment" && changed ? rule.revision + 1 : rule.revision;

  await store.commitRuleSettlement({
    ruleId: rule.id,
    expectedRevision: rule.revision,
    nextRevision: revision,
    lifecycle,
    lifecycleChanged: lifecycle !== rule.lifecycle,
    health: "ready",
    attentionReasonsJson: null,
    generated,
    settledDates: pending,
    now,
  });

  return report(
    rule,
    pending.length === 0 ? "not_due" : "settled",
    pending.length,
    pending.length * (rule.amountMinor as number),
  );
}
