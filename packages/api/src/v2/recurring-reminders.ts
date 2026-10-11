import { addDays, formatISO } from "date-fns";
import { Clock, Effect } from "effect";
import type { z } from "zod";

import { localDateInTimeZone } from "@trove/domain/clock";
import { pendingDatesFrom } from "@trove/domain/settlement";

import {
  DueHorizonExceeded,
  OccurrenceAlreadyRecorded,
  OccurrenceNotScheduled,
  RecurringRuleAutoPosts,
  RecurringRuleInactive,
  RecurringRuleNotFound,
  TransferSameAccount,
} from "./budget-errors";
import { inLedgerMutation } from "./budget-mutation";
import { BudgetClock } from "./budget-services";
import type {
  recurringPaySchema,
  V2DueList,
  V2DueOccurrence,
  V2RecordedOccurrence,
} from "./contracts";
import { settleableRule } from "./recurring";
import { ReminderStore, type RuleRow } from "./recurring-reminder-store";

/** Most pending reminders one Due read returns; the rest are reported as `truncated`. */
export const DUE_LIST_LIMIT = 200;
/** Furthest a Due read looks ahead of the clock. */
export const DUE_HORIZON_DAYS = 366;

export type RecurringPay = z.output<typeof recurringPaySchema>;

/**
 * Pending occurrences of active `remind` rules, from each rule's earliest unpaid and
 * unskipped date through `through`, so an overdue item stays until it is paid or skipped.
 */
export const listDue = Effect.fn("listDue")(function* (through: string) {
  const { now } = yield* BudgetClock;
  if (through > formatISO(addDays(now, DUE_HORIZON_DAYS), { representation: "date" })) {
    return yield* new DueHorizonExceeded({ horizonDays: DUE_HORIZON_DAYS });
  }
  const store = yield* ReminderStore;
  const rules = yield* store.activeReminderRules;
  if (rules.length === 0) return { items: [], truncated: false } satisfies V2DueList;
  const recorded = yield* store.recordedDatesOf(rules.map((rule) => rule.id));
  const items: V2DueOccurrence[] = [];
  for (const rule of rules) {
    const today = localDateInTimeZone(now, rule.timeZone);
    const recordedDates = recorded
      .filter((occurrence) => occurrence.ruleId === rule.id)
      .map((occurrence) => occurrence.scheduledDate);
    for (const date of pendingDatesFrom(settleableRule(rule), through, recordedDates)) {
      items.push({
        ruleId: rule.id,
        name: rule.name,
        scheduledDate: date,
        amountMinor: rule.amountMinor,
        currency: rule.currency,
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        kind: rule.kind,
        overdue: date < today,
      });
    }
  }
  items.sort(
    (left, right) =>
      left.scheduledDate.localeCompare(right.scheduledDate) ||
      left.name.localeCompare(right.name) ||
      left.ruleId.localeCompare(right.ruleId),
  );
  return {
    items: items.slice(0, DUE_LIST_LIMIT),
    truncated: items.length > DUE_LIST_LIMIT,
  } satisfies V2DueList;
});

/**
 * Mark paid: settles one pending occurrence of a `remind` rule through the settlement
 * commit, as one Generated Transaction with the confirmed amount, account, and date.
 * Overrides apply to this occurrence only; the rule keeps its amount and account.
 */
export const payOccurrence = Effect.fn("payOccurrence")(function* (
  ruleId: string,
  scheduledDate: string,
  input: RecurringPay,
  idempotencyKey: string | undefined,
) {
  return yield* inLedgerMutation(
    "recurring.pay",
    idempotencyKey,
    writePayment(ruleId, scheduledDate, input),
  );
});

const writePayment = Effect.fn("writePayment")(function* (
  ruleId: string,
  scheduledDate: string,
  input: RecurringPay,
) {
  const store = yield* ReminderStore;
  const { rule, recordedDates } = yield* pendingReminder(ruleId, scheduledDate);
  const accountId = input.accountId ?? rule.accountId;
  if (accountId === rule.toAccountId) return yield* new TransferSameAccount();
  yield* store.validateRule({ ...rule, accountId });
  const transactionId = crypto.randomUUID();
  const now = new Date(yield* Clock.currentTimeMillis);
  yield* store.settle({
    ruleId: rule.id,
    expectedRevision: rule.revision,
    nextRevision: rule.revision + 1,
    ...lifecycleAfterRecording(rule, [...recordedDates, scheduledDate]),
    health: "ready",
    attentionReasonsJson: null,
    generated: [
      {
        transactionId,
        type: rule.kind,
        amountMinor: input.amountMinor ?? rule.amountMinor,
        currency: rule.currency,
        date: input.date ?? scheduledDate,
        accountId,
        toAccountId: rule.toAccountId,
        categoryId: rule.categoryId,
        description: rule.note || rule.name,
      },
    ],
    settledDates: [scheduledDate],
    now: now.toISOString(),
  });
  return {
    ruleId: rule.id,
    scheduledDate,
    status: "settled",
    transactionId,
  } satisfies V2RecordedOccurrence;
});

/** Skip this time: records the occurrence as skipped and posts no transaction. */
export const skipOccurrence = Effect.fn("skipOccurrence")(function* (
  ruleId: string,
  scheduledDate: string,
  idempotencyKey: string | undefined,
) {
  return yield* inLedgerMutation(
    "recurring.skip",
    idempotencyKey,
    writeSkip(ruleId, scheduledDate),
  );
});

const writeSkip = Effect.fn("writeSkip")(function* (ruleId: string, scheduledDate: string) {
  const { rule, recordedDates } = yield* pendingReminder(ruleId, scheduledDate);
  const now = new Date(yield* Clock.currentTimeMillis);
  const { lifecycle } = lifecycleAfterRecording(rule, [...recordedDates, scheduledDate]);
  yield* (yield* ReminderStore).recordSkip(rule, scheduledDate, lifecycle, now);
  return {
    ruleId: rule.id,
    scheduledDate,
    status: "skipped",
    transactionId: null,
  } satisfies V2RecordedOccurrence;
});

/** The active `remind` rule and its recorded dates, when `scheduledDate` is still pending. */
const pendingReminder = Effect.fn("pendingReminder")(function* (
  ruleId: string,
  scheduledDate: string,
) {
  const store = yield* ReminderStore;
  const rule = yield* store.findRule(ruleId);
  if (!rule) return yield* new RecurringRuleNotFound();
  if (rule.mode !== "remind") return yield* new RecurringRuleAutoPosts();
  if (rule.lifecycle !== "active") return yield* new RecurringRuleInactive();
  const recorded = yield* store.recordedOccurrences(ruleId);
  const existing = recorded.find((occurrence) => occurrence.scheduledDate === scheduledDate);
  if (existing) return yield* new OccurrenceAlreadyRecorded({ status: existing.status });
  const recordedDates = recorded.map((occurrence) => occurrence.scheduledDate);
  if (
    !pendingDatesFrom(settleableRule(rule), scheduledDate, recordedDates).includes(scheduledDate)
  ) {
    return yield* new OccurrenceNotScheduled();
  }
  return { rule, recordedDates };
});

/** A rule completes once it has no scheduled date left to pay or skip. */
function lifecycleAfterRecording(rule: RuleRow, recordedDates: readonly string[]) {
  const exhausted =
    (rule.endCount !== null && recordedDates.length >= rule.endCount) ||
    (rule.endDate !== null &&
      pendingDatesFrom(settleableRule(rule), rule.endDate, recordedDates).length === 0);
  const lifecycle = exhausted ? "completed" : rule.lifecycle;
  return { lifecycle, lifecycleChanged: lifecycle !== rule.lifecycle };
}
