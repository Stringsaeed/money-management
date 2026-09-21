import { and, asc, eq, ne, or } from "drizzle-orm";

import {
  settleRule,
  pendingDatesFrom,
  type RuleSettlementCommit,
  type RuleSettlementResult,
  type SettleableRule,
  type SettlementIdentity,
  type SettlementStore,
} from "@trove/domain/settlement";
import { dateAfter } from "@trove/domain/calendar";
import { localDateInTimeZone } from "@trove/domain/clock";
import {
  v2Account,
  v2Category,
  v2RecurringOccurrence,
  v2RecurringRule,
  v2Transaction,
} from "@trove/db/schema/v2-ledger";

import {
  recurringCreateSchema,
  recurringUpdateSchema,
  type V2AttentionReason,
  type V2RecurringCreateInput,
  type V2RecurringUpdateInput,
  type V2RecurringRule,
  type V2TransactionKind,
} from "./contracts";
import {
  iso,
  requireExpectedVersion,
  safeMinor,
  type V2Database,
  type V2DbExecutor,
  type V2LedgerContext,
  V2ApiError,
  withLedgerMutation,
} from "./shared";

type RuleRow = typeof v2RecurringRule.$inferSelect;

function parseAttentionReasons(value: readonly V2AttentionReason[]): readonly V2AttentionReason[] {
  return value;
}

function ruleRow(row: RuleRow): V2RecurringRule {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    name: row.name,
    accountId: row.accountId,
    categoryId: row.categoryId,
    toAccountId: row.toAccountId,
    kind: row.kind,
    amountMinor: safeMinor(row.amountMinor, "Recurring amount"),
    currency: row.currency,
    note: row.note,
    frequency: row.frequency,
    intervalCount: row.intervalCount,
    startDate: row.startDate,
    endDate: row.endDate,
    endCount: row.endCount,
    timeZone: row.timeZone,
    lifecycle: row.lifecycle,
    health: row.health,
    attentionReasons: parseAttentionReasons(row.attentionReasons ?? []),
    eligibilityFloor: row.eligibilityFloor,
    revision: row.revision,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

async function findRule(db: V2DbExecutor, ledgerId: string, id: string): Promise<RuleRow | null> {
  const rows = await db
    .select()
    .from(v2RecurringRule)
    .where(and(eq(v2RecurringRule.ledgerId, ledgerId), eq(v2RecurringRule.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

async function validateRuleDependencies(
  db: V2DbExecutor,
  ledgerId: string,
  rule: {
    readonly kind: V2TransactionKind;
    readonly currency: string;
    readonly accountId: string;
    readonly toAccountId: string | null;
    readonly categoryId: string | null;
  },
): Promise<void> {
  const accounts = await db
    .select()
    .from(v2Account)
    .where(
      and(
        eq(v2Account.ledgerId, ledgerId),
        or(
          eq(v2Account.id, rule.accountId),
          rule.toAccountId ? eq(v2Account.id, rule.toAccountId) : undefined,
        ),
      ),
    );
  const source = accounts.find((account) => account.id === rule.accountId);
  validateSourceAccount(source, rule.currency);
  validateRecurringTransfer(accounts, source, rule);
  await validateRecurringCategory(db, ledgerId, rule);
}

function validateSourceAccount(
  source: typeof v2Account.$inferSelect | undefined,
  currency: string,
): asserts source is typeof v2Account.$inferSelect {
  if (!source)
    throw new V2ApiError(
      422,
      "account_not_found",
      "Recurring source Account is not in this ledger.",
    );
  if (source.lifecycle !== "active")
    throw new V2ApiError(422, "account_archived", "Recurring source Account is archived.");
  if (source.currency !== currency)
    throw new V2ApiError(
      422,
      "currency_mismatch",
      "Recurring currency must match its source Account.",
    );
}

function validateRecurringTransfer(
  accounts: readonly (typeof v2Account.$inferSelect)[],
  source: typeof v2Account.$inferSelect,
  rule: {
    readonly kind: V2TransactionKind;
    readonly toAccountId: string | null;
    readonly categoryId: string | null;
  },
): void {
  if (rule.kind !== "transfer") {
    if (rule.toAccountId)
      throw new V2ApiError(
        422,
        "non_transfer_destination_forbidden",
        "Only recurring transfers have a destination Account.",
      );
    return;
  }
  if (!rule.toAccountId)
    throw new V2ApiError(
      422,
      "transfer_destination_required",
      "Recurring transfer needs a destination Account.",
    );
  const destination = accounts.find((account) => account.id === rule.toAccountId);
  if (!destination)
    throw new V2ApiError(
      422,
      "account_not_found",
      "Recurring destination Account is not in this ledger.",
    );
  if (destination.lifecycle !== "active")
    throw new V2ApiError(422, "account_archived", "Recurring destination Account is archived.");
  if (destination.currency !== source.currency)
    throw new V2ApiError(422, "currency_mismatch", "Recurring transfers must use one currency.");
  if (rule.categoryId)
    throw new V2ApiError(
      422,
      "transfer_category_forbidden",
      "Recurring transfers cannot have a Category.",
    );
}

async function validateRecurringCategory(
  db: V2DbExecutor,
  ledgerId: string,
  rule: { readonly kind: V2TransactionKind; readonly categoryId: string | null },
): Promise<void> {
  if (!rule.categoryId) return;
  const categories = await db
    .select()
    .from(v2Category)
    .where(and(eq(v2Category.ledgerId, ledgerId), eq(v2Category.id, rule.categoryId)))
    .limit(1);
  const category = categories[0];
  if (!category)
    throw new V2ApiError(422, "category_not_found", "Recurring Category is not in this ledger.");
  if (category.lifecycle !== "active")
    throw new V2ApiError(422, "category_archived", "Recurring Category is archived.");
  const expectedKind = rule.kind === "income" ? "income" : "expense";
  if (category.kind !== expectedKind)
    throw new V2ApiError(
      422,
      "category_kind_mismatch",
      "Recurring Category kind does not match the Rule.",
    );
}

function settleableRule(row: RuleRow): SettleableRule {
  return {
    id: row.id,
    name: row.name,
    type: row.kind,
    amountMinor: safeMinor(row.amountMinor, "Recurring amount"),
    currency: row.currency,
    accountId: row.accountId,
    toAccountId: row.toAccountId,
    categoryId: row.categoryId,
    description: row.note,
    frequency: row.frequency,
    intervalCount: row.intervalCount,
    startDate: row.startDate,
    endDate: row.endDate,
    endCount: row.endCount,
    lifecycle: row.lifecycle,
    health: row.health,
    eligibilityFloor: row.eligibilityFloor,
    revision: row.revision,
    timeZone: row.timeZone,
  };
}

export async function listRecurringRules(
  context: V2LedgerContext,
  options: { readonly includeArchived?: boolean } = {},
): Promise<readonly V2RecurringRule[]> {
  const rows = await context.db
    .select()
    .from(v2RecurringRule)
    .where(
      options.includeArchived
        ? eq(v2RecurringRule.ledgerId, context.ledgerId)
        : and(
            eq(v2RecurringRule.ledgerId, context.ledgerId),
            ne(v2RecurringRule.lifecycle, "archived"),
          ),
    )
    .orderBy(asc(v2RecurringRule.name), asc(v2RecurringRule.id));
  return rows.map(ruleRow);
}

export async function getRecurringRule(
  context: V2LedgerContext,
  id: string,
): Promise<V2RecurringRule> {
  const row = await findRule(context.db, context.ledgerId, id);
  if (!row) throw new V2ApiError(404, "recurring_rule_not_found", "Recurring Rule not found.");
  return ruleRow(row);
}

export async function createRecurringRule(
  context: V2LedgerContext,
  input: V2RecurringCreateInput,
  idempotencyKey?: string,
): Promise<V2RecurringRule> {
  const parsed = recurringCreateSchema.parse(input);
  assertTimeZone(parsed.timeZone);
  await validateRuleDependencies(context.db, context.ledgerId, {
    kind: parsed.kind,
    currency: parsed.currency,
    accountId: parsed.accountId,
    toAccountId: parsed.toAccountId ?? null,
    categoryId: parsed.categoryId ?? null,
  });
  return withLedgerMutation(context, "recurring.create", idempotencyKey, async (db) => {
    const id = parsed.id ?? crypto.randomUUID();
    if (await findRule(db, context.ledgerId, id)) {
      throw new V2ApiError(
        409,
        "recurring_rule_exists",
        "A Recurring Rule with this id already exists.",
      );
    }
    const now = new Date();
    const inserted = await db
      .insert(v2RecurringRule)
      .values({
        ledgerId: context.ledgerId,
        id,
        name: parsed.name,
        kind: parsed.kind,
        amountMinor: parsed.amountMinor,
        currency: parsed.currency,
        accountId: parsed.accountId,
        toAccountId: parsed.toAccountId ?? null,
        categoryId: parsed.categoryId ?? null,
        note: parsed.note,
        frequency: parsed.frequency,
        intervalCount: parsed.intervalCount,
        startDate: parsed.startDate,
        endDate: parsed.endDate ?? null,
        endCount: parsed.endCount ?? null,
        timeZone: parsed.timeZone,
        eligibilityFloor: parsed.startDate,
        createdBy: context.ownerId,
        updatedBy: context.ownerId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const row = inserted[0];
    if (!row)
      throw new V2ApiError(500, "recurring_create_failed", "Recurring Rule could not be created.");
    return ruleRow(row);
  });
}

export async function updateRecurringRule(
  context: V2LedgerContext,
  id: string,
  input: V2RecurringUpdateInput,
  expectedRevision?: number,
  idempotencyKey?: string,
): Promise<V2RecurringRule> {
  const parsed = recurringUpdateSchema.parse(input);
  return withLedgerMutation(context, "recurring.update", idempotencyKey, async (db) => {
    const current = await findRule(db, context.ledgerId, id);
    if (!current)
      throw new V2ApiError(404, "recurring_rule_not_found", "Recurring Rule not found.");
    requireExpectedVersion(expectedRevision, current.revision, id);
    assertLifecycleUpdateAllowed(current.lifecycle, parsed.lifecycle);
    const merged = mergeRecurringRule(current, parsed);
    recurringCreateSchema.parse(merged);
    assertTimeZone(merged.timeZone);
    await validateRuleDependencies(db, context.ledgerId, merged);
    const lifecycle = parsed.lifecycle ?? current.lifecycle;
    const eligibilityFloor = nextEligibilityFloor(current, lifecycle, merged.timeZone);
    const updated = await db
      .update(v2RecurringRule)
      .set({
        ...merged,
        lifecycle,
        eligibilityFloor,
        revision: current.revision + 1,
        updatedBy: context.ownerId,
        updatedAt: new Date(),
      })
      .where(and(eq(v2RecurringRule.ledgerId, context.ledgerId), eq(v2RecurringRule.id, id)))
      .returning();
    const row = updated[0];
    if (!row)
      throw new V2ApiError(500, "recurring_update_failed", "Recurring Rule could not be updated.");
    return ruleRow(row);
  });
}

function assertLifecycleUpdateAllowed(
  current: V2RecurringRule["lifecycle"],
  requested: V2RecurringRule["lifecycle"] | undefined,
): void {
  if (current === "completed" && requested && requested !== "completed") {
    throw new V2ApiError(
      409,
      "recurring_rule_completed",
      "A completed Recurring Rule cannot be resumed.",
    );
  }
}

function mergeRecurringRule(
  current: RuleRow,
  parsed: ReturnType<typeof recurringUpdateSchema.parse>,
) {
  return {
    name: fallback(parsed.name, current.name),
    accountId: fallback(parsed.accountId, current.accountId),
    categoryId: fallback(parsed.categoryId, current.categoryId),
    toAccountId: fallback(parsed.toAccountId, current.toAccountId),
    kind: fallback(parsed.kind, current.kind),
    amountMinor: fallback(parsed.amountMinor, safeMinor(current.amountMinor, "Recurring amount")),
    currency: fallback(parsed.currency, current.currency),
    note: fallback(parsed.note, current.note),
    frequency: fallback(parsed.frequency, current.frequency),
    intervalCount: fallback(parsed.intervalCount, current.intervalCount),
    startDate: fallback(parsed.startDate, current.startDate),
    endDate: fallback(parsed.endDate, current.endDate),
    endCount: fallback(parsed.endCount, current.endCount),
    timeZone: fallback(parsed.timeZone, current.timeZone),
  };
}

function fallback<T>(value: T | undefined, current: T): T {
  return value === undefined ? current : value;
}

function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
  } catch {
    throw new V2ApiError(
      422,
      "invalid_time_zone",
      "Recurring Rule timeZone must be an IANA time zone.",
    );
  }
}

function nextEligibilityFloor(current: RuleRow, lifecycle: string, timeZone: string): string {
  return lifecycle !== current.lifecycle && lifecycle === "active"
    ? dateAfter(localDateInTimeZone(new Date(), timeZone))
    : current.eligibilityFloor;
}

export interface UpcomingOccurrence {
  readonly ruleId: string;
  readonly scheduledDate: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly kind: V2TransactionKind;
}

export async function listUpcoming(
  context: V2LedgerContext,
  throughDate = new Date(),
): Promise<readonly UpcomingOccurrence[]> {
  const rows = await context.db
    .select()
    .from(v2RecurringRule)
    .where(
      and(eq(v2RecurringRule.ledgerId, context.ledgerId), eq(v2RecurringRule.lifecycle, "active")),
    );
  const occurrenceRows = await context.db
    .select({
      ruleId: v2RecurringOccurrence.ruleId,
      scheduledDate: v2RecurringOccurrence.scheduledDate,
    })
    .from(v2RecurringOccurrence)
    .where(eq(v2RecurringOccurrence.ledgerId, context.ledgerId));
  const settledByRule = new Map<string, string[]>();
  for (const occurrence of occurrenceRows) {
    const dates = settledByRule.get(occurrence.ruleId) ?? [];
    dates.push(occurrence.scheduledDate);
    settledByRule.set(occurrence.ruleId, dates);
  }
  const upcoming: UpcomingOccurrence[] = [];
  for (const row of rows) {
    const localDate = localDateInTimeZone(throughDate, row.timeZone);
    const store = new V2RecurringStore(context.db, context.ledgerId, context.ownerId, () =>
      crypto.randomUUID(),
    );
    const dates = await store.getPendingDates(
      settleableRule(row),
      localDate,
      settledByRule.get(row.id) ?? [],
    );
    for (const date of dates) {
      upcoming.push({
        ruleId: row.id,
        scheduledDate: date,
        amountMinor: safeMinor(row.amountMinor, "Recurring amount"),
        currency: row.currency,
        kind: row.kind,
      });
    }
  }
  return upcoming.sort(
    (left, right) =>
      left.scheduledDate.localeCompare(right.scheduledDate) ||
      left.ruleId.localeCompare(right.ruleId),
  );
}

class V2RecurringStore implements SettlementStore {
  constructor(
    private readonly db: V2Database,
    private readonly ledgerId: string,
    private readonly actorId: string,
    private readonly nextTransactionId: () => string,
  ) {}

  async getAccountCurrency(accountId: string): Promise<string | null> {
    const rows = await this.db
      .select({ currency: v2Account.currency })
      .from(v2Account)
      .where(and(eq(v2Account.ledgerId, this.ledgerId), eq(v2Account.id, accountId)))
      .limit(1);
    return rows[0]?.currency ?? null;
  }

  async getSettledDates(ruleId: string): Promise<string[]> {
    const rows = await this.db
      .select({ scheduledDate: v2RecurringOccurrence.scheduledDate })
      .from(v2RecurringOccurrence)
      .where(
        and(
          eq(v2RecurringOccurrence.ledgerId, this.ledgerId),
          eq(v2RecurringOccurrence.ruleId, ruleId),
        ),
      );
    return rows.map((row) => row.scheduledDate).sort();
  }

  async getPendingDates(rule: SettleableRule, localDate: string, settledDates: readonly string[]) {
    return pendingDatesFrom(rule, localDate, settledDates);
  }

  async commitRuleSettlement(commit: RuleSettlementCommit): Promise<void> {
    await this.db.transaction(async (tx) => {
      const currentRows = await tx
        .select()
        .from(v2RecurringRule)
        .where(
          and(eq(v2RecurringRule.ledgerId, this.ledgerId), eq(v2RecurringRule.id, commit.ruleId)),
        )
        .limit(1);
      const current = currentRows[0];
      if (!current || current.revision !== commit.expectedRevision) {
        throw new V2ApiError(
          412,
          "version_conflict",
          "The Recurring Rule changed. Refresh and try again.",
        );
      }
      for (const generated of commit.generated) {
        const transactionId = generated.transactionId;
        await tx.insert(v2Transaction).values({
          ledgerId: this.ledgerId,
          id: transactionId,
          kind: generated.type,
          amountMinor: generated.amountMinor,
          currency: generated.currency,
          date: generated.date,
          // SAFETY: settleRule refuses rules without a source Account before generating a transaction.
          accountId: generated.accountId as string,
          toAccountId: generated.toAccountId,
          categoryId: generated.categoryId,
          recurringRuleId: commit.ruleId,
          note: generated.description,
          createdBy: this.actorId,
          updatedBy: this.actorId,
        });
        await tx.insert(v2RecurringOccurrence).values({
          id: crypto.randomUUID(),
          ledgerId: this.ledgerId,
          ruleId: commit.ruleId,
          scheduledDate: generated.date,
          transactionId,
          settledAt: new Date(commit.now),
        });
      }
      await tx
        .update(v2RecurringRule)
        .set({
          lifecycle: commit.lifecycle,
          health: commit.health,
          attentionReasons: commit.attentionReasonsJson
            ? JSON.parse(commit.attentionReasonsJson)
            : [],
          revision: commit.nextRevision,
          updatedBy: this.actorId,
          updatedAt: new Date(commit.now),
        })
        .where(
          and(eq(v2RecurringRule.ledgerId, this.ledgerId), eq(v2RecurringRule.id, commit.ruleId)),
        );
    });
  }
}

export async function settleRecurringRule(
  context: V2LedgerContext,
  id: string,
  now = new Date(),
): Promise<RuleSettlementResult> {
  const row = await findRule(context.db, context.ledgerId, id);
  if (!row) throw new V2ApiError(404, "recurring_rule_not_found", "Recurring Rule not found.");
  const identity: SettlementIdentity = { next: () => crypto.randomUUID() };
  return settleRule(
    new V2RecurringStore(context.db, context.ledgerId, context.ownerId, () => crypto.randomUUID()),
    settleableRule(row),
    localDateInTimeZone(now, row.timeZone),
    now.toISOString(),
    identity,
    "increment",
  );
}

export interface V2SettlementSummary {
  readonly ledgers: number;
  readonly generatedCount: number;
  readonly rules: readonly RuleSettlementResult[];
}

/** Exported for the Worker cron integration; it never touches legacy rules. */
export async function settleV2DueRules(
  db: V2Database,
  now = new Date(),
): Promise<V2SettlementSummary> {
  const rows = await db
    .select()
    .from(v2RecurringRule)
    .where(eq(v2RecurringRule.lifecycle, "active"));
  const results: RuleSettlementResult[] = [];
  for (const row of rows) {
    const identity: SettlementIdentity = { next: () => crypto.randomUUID() };
    const result = await settleRule(
      new V2RecurringStore(db, row.ledgerId, row.updatedBy, () => crypto.randomUUID()),
      settleableRule(row),
      localDateInTimeZone(now, row.timeZone),
      now.toISOString(),
      identity,
      "increment",
    );
    results.push(result);
  }
  return {
    ledgers: new Set(rows.map((row) => row.ledgerId)).size,
    generatedCount: results.reduce((total, result) => total + result.generatedCount, 0),
    rules: results,
  };
}
