import { and, asc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";

import { localDateInTimeZone } from "@trove/domain/clock";
import {
  nextPeriodStart,
  paydaysLeft,
  projectBudget,
  ruleInEffect,
  savingPerPayday,
  type BudgetFacts,
  type BudgetProjection,
  type PaydayChange,
} from "@trove/domain/budget";
import {
  v2Assignment,
  v2Budget,
  v2BudgetFundingAccount,
  v2BudgetPayday,
  v2Envelope,
  v2EnvelopeCategory,
} from "@trove/db/schema/v2-budget";
import { v2Account, v2Transaction } from "@trove/db/schema/v2-ledger";

import { BUDGET_CURRENCY, type V2Budget, type V2BudgetView, type V2Envelope } from "./contracts";
import { iso, safeMinor, type V2DbExecutor, type V2LedgerContext } from "./shared";

/**
 * Budget reads (#366/#367). Every total is derived on read by `projectBudget`
 * from the stored plan plus bounded, ledger-scoped aggregates over
 * transactions. Facts dated after today do not count yet.
 */

/** v1 budgets are AED, so "today" is the UAE Ledger Date. */
export const BUDGET_TIME_ZONE = "Asia/Dubai";

export function budgetToday(now: Date): string {
  return localDateInTimeZone(now, BUDGET_TIME_ZONE);
}

type BudgetRow = typeof v2Budget.$inferSelect;
type EnvelopeRow = typeof v2Envelope.$inferSelect;

/** The stored plan plus the projection derived from it. */
export interface LoadedBudget {
  readonly budget: BudgetRow;
  readonly paydays: readonly PaydayChange[];
  readonly fundingAccountIds: readonly string[];
  readonly envelopes: readonly (EnvelopeRow & { readonly categoryIds: readonly string[] })[];
  readonly projection: BudgetProjection;
}

export async function findBudget(db: V2DbExecutor, ledgerId: string): Promise<BudgetRow | null> {
  const rows = await db.select().from(v2Budget).where(eq(v2Budget.ledgerId, ledgerId)).limit(1);
  return rows[0] ?? null;
}

export async function getBudget(context: V2LedgerContext, today: string): Promise<V2BudgetView> {
  const budget = await findBudget(context.db, context.ledgerId);
  if (!budget) return { budget: null };
  return budgetView(await loadBudget(context.db, budget, today));
}

export function budgetView(loaded: LoadedBudget): V2BudgetView {
  const { budget, projection } = loaded;
  const current = projection.current;
  return {
    budget: budgetRow(budget),
    paydayRule: ruleInEffect(loaded.paydays, current.period.start),
    fundingAccountIds: loaded.fundingAccountIds,
    envelopes: loaded.envelopes.map((envelope) => ({
      ...envelopeRow(envelope),
      ...savingSuggestion(loaded, envelope),
    })),
    current: {
      period: current.period,
      unassignedMinor: current.unassignedMinor,
      safeToSpendMinor: current.safeToSpendMinor,
      perDayMinor: current.perDayMinor,
      daysLeft: current.daysLeft,
      cardReserveMinor: current.cardReserveMinor,
      envelopes: current.envelopes.map((totals) => ({
        id: totals.envelopeId,
        plannedMinor: totals.plannedMinor,
        spentMinor: totals.spentMinor,
        rolloverMinor: totals.rolloverMinor,
        leftMinor: totals.leftMinor,
      })),
    },
  };
}

/**
 * Per-payday suggestion for a Saving-for envelope with a target and due date
 * (data rule 10). The envelope's current Left counts as already set aside, so
 * the suggestion recalculates after every assignment or payment.
 */
function savingSuggestion(
  loaded: LoadedBudget,
  envelope: EnvelopeRow,
): Pick<V2Envelope, "savingPerPaydayMinor" | "paydaysLeft" | "shortBeforePaydayMinor"> {
  if (envelope.group !== "saving" || envelope.targetMinor === null || envelope.dueDate === null) {
    return {};
  }
  const targetMinor = safeMinor(envelope.targetMinor, "Envelope target");
  const currentStart = loaded.projection.current.period.start;
  const rule = ruleInEffect(loaded.paydays, currentStart);
  const leftMinor =
    loaded.projection.current.envelopes.find((totals) => totals.envelopeId === envelope.id)
      ?.leftMinor ?? 0;
  const goal = {
    targetMinor,
    setAsideMinor: Math.max(leftMinor, 0),
    dueDate: envelope.dueDate,
    rule,
    currentPeriodStart: currentStart,
  };
  const dueBeforePayday = envelope.dueDate < nextPeriodStart(rule, currentStart);
  return {
    savingPerPaydayMinor: savingPerPayday(goal),
    paydaysLeft: paydaysLeft(goal),
    ...(dueBeforePayday &&
      leftMinor < targetMinor && { shortBeforePaydayMinor: targetMinor - Math.max(leftMinor, 0) }),
  };
}

/** Loads the plan and bounded transaction aggregates, then projects them. */
export async function loadBudget(
  db: V2DbExecutor,
  budget: BudgetRow,
  today: string,
): Promise<LoadedBudget> {
  const ledgerId = budget.ledgerId;
  const [paydayRows, fundingRows, envelopeRows, assignmentRows, cardRows] = await Promise.all([
    db.select().from(v2BudgetPayday).where(eq(v2BudgetPayday.budgetId, budget.id)),
    db
      .select({ accountId: v2BudgetFundingAccount.accountId })
      .from(v2BudgetFundingAccount)
      .where(eq(v2BudgetFundingAccount.budgetId, budget.id))
      .orderBy(asc(v2BudgetFundingAccount.createdAt), asc(v2BudgetFundingAccount.accountId)),
    db
      .select()
      .from(v2Envelope)
      .where(and(eq(v2Envelope.budgetId, budget.id), eq(v2Envelope.lifecycle, "active")))
      .orderBy(asc(v2Envelope.sortOrder), asc(v2Envelope.id)),
    // One row per (period, from, to): bounded by periods x envelope pairs, not by moves.
    db
      .select({
        periodStart: v2Assignment.periodStart,
        fromEnvelopeId: v2Assignment.fromEnvelopeId,
        toEnvelopeId: v2Assignment.toEnvelopeId,
        amountMinor: sql<string>`sum(${v2Assignment.amountMinor})`,
      })
      .from(v2Assignment)
      .where(eq(v2Assignment.budgetId, budget.id))
      .groupBy(v2Assignment.periodStart, v2Assignment.fromEnvelopeId, v2Assignment.toEnvelopeId),
    db
      .select({ id: v2Account.id })
      .from(v2Account)
      .where(
        and(
          eq(v2Account.ledgerId, ledgerId),
          eq(v2Account.type, "credit_card"),
          eq(v2Account.currency, BUDGET_CURRENCY),
        ),
      ),
  ]);

  const paydays = paydayRows.map(paydayChange);
  const fundingAccountIds = fundingRows.map((row) => row.accountId);
  const cardAccountIds = cardRows.map((row) => row.id);
  const envelopeIds = envelopeRows.map((row) => row.id);
  const mappingRows =
    envelopeIds.length === 0
      ? []
      : await db
          .select({
            envelopeId: v2EnvelopeCategory.envelopeId,
            categoryId: v2EnvelopeCategory.categoryId,
          })
          .from(v2EnvelopeCategory)
          .where(
            and(
              eq(v2EnvelopeCategory.ledgerId, ledgerId),
              inArray(v2EnvelopeCategory.envelopeId, envelopeIds),
            ),
          );
  const envelopes = envelopeRows.map((row) => ({
    ...row,
    categoryIds: mappingRows
      .filter((mapping) => mapping.envelopeId === row.id)
      .map((mapping) => mapping.categoryId)
      .sort(),
  }));
  const mappedCategoryIds = mappingRows.map((mapping) => mapping.categoryId);
  const range = { from: budget.activationPeriodStart, to: today };

  const [balances, spending, cardPayments] = await Promise.all([
    balancesAsOf(db, ledgerId, fundingAccountIds, today),
    mappedSpending(db, ledgerId, mappedCategoryIds, fundingAccountIds, cardAccountIds, range),
    cardPaymentsSince(db, ledgerId, fundingAccountIds, cardAccountIds, range),
  ]);
  let cashMinor = 0;
  for (const value of balances.values()) cashMinor += value;

  const facts: BudgetFacts = {
    paydays,
    activationStart: budget.activationPeriodStart,
    envelopes: envelopes.map((envelope) => ({
      id: envelope.id,
      group: envelope.group,
      categoryIds: envelope.categoryIds,
      startFresh: envelope.startFresh,
    })),
    assignments: assignmentRows.map((row) => ({
      periodStart: row.periodStart,
      fromEnvelopeId: row.fromEnvelopeId,
      toEnvelopeId: row.toEnvelopeId,
      amountMinor: safeMinor(row.amountMinor, "Assignment total"),
    })),
    spending,
    cardPayments,
    cashMinor,
    today,
  };
  return { budget, paydays, fundingAccountIds, envelopes, projection: projectBudget(facts) };
}

/** Opening balance plus every transaction dated on or before `today`. */
export async function balancesAsOf(
  db: V2DbExecutor,
  ledgerId: string,
  accountIds: readonly string[],
  today: string,
): Promise<Map<string, number>> {
  if (accountIds.length === 0) return new Map();
  const [accounts, rows] = await Promise.all([
    db
      .select({ id: v2Account.id, openingBalanceMinor: v2Account.openingBalanceMinor })
      .from(v2Account)
      .where(and(eq(v2Account.ledgerId, ledgerId), inArray(v2Account.id, [...accountIds]))),
    db
      .select({
        accountId: v2Transaction.accountId,
        toAccountId: v2Transaction.toAccountId,
        kind: v2Transaction.kind,
        amountMinor: sql<string>`sum(${v2Transaction.amountMinor})`,
      })
      .from(v2Transaction)
      .where(
        and(
          eq(v2Transaction.ledgerId, ledgerId),
          lte(v2Transaction.date, today),
          or(
            inArray(v2Transaction.accountId, [...accountIds]),
            inArray(v2Transaction.toAccountId, [...accountIds]),
          ),
        ),
      )
      .groupBy(v2Transaction.accountId, v2Transaction.toAccountId, v2Transaction.kind),
  ]);
  const balances = new Map(
    accounts.map((row) => [row.id, safeMinor(row.openingBalanceMinor, "Opening balance")]),
  );
  for (const row of rows) {
    const amount = safeMinor(row.amountMinor, "Transaction total");
    const source = balances.get(row.accountId);
    if (source !== undefined) {
      balances.set(row.accountId, source + (row.kind === "income" ? amount : -amount));
    }
    const destination = row.toAccountId ? balances.get(row.toAccountId) : undefined;
    if (row.kind === "transfer" && row.toAccountId && destination !== undefined) {
      balances.set(row.toAccountId, destination + amount);
    }
  }
  return balances;
}

interface DateRange {
  readonly from: string;
  readonly to: string;
}

/** Expenses in mapped Categories from funding or credit-card accounts, one row per day/category/account. */
async function mappedSpending(
  db: V2DbExecutor,
  ledgerId: string,
  categoryIds: readonly string[],
  fundingAccountIds: readonly string[],
  cardAccountIds: readonly string[],
  range: DateRange,
): Promise<BudgetFacts["spending"]> {
  const accountIds = [...fundingAccountIds, ...cardAccountIds];
  if (categoryIds.length === 0 || accountIds.length === 0) return [];
  const rows = await db
    .select({
      date: v2Transaction.date,
      categoryId: v2Transaction.categoryId,
      accountId: v2Transaction.accountId,
      amountMinor: sql<string>`sum(${v2Transaction.amountMinor})`,
    })
    .from(v2Transaction)
    .where(
      and(
        eq(v2Transaction.ledgerId, ledgerId),
        eq(v2Transaction.kind, "expense"),
        gte(v2Transaction.date, range.from),
        lte(v2Transaction.date, range.to),
        inArray(v2Transaction.categoryId, [...categoryIds]),
        inArray(v2Transaction.accountId, accountIds),
      ),
    )
    .groupBy(v2Transaction.date, v2Transaction.categoryId, v2Transaction.accountId);
  const cards = new Set(cardAccountIds);
  return rows.flatMap((row) =>
    row.categoryId
      ? [
          {
            date: row.date,
            categoryId: row.categoryId,
            amountMinor: safeMinor(row.amountMinor, "Spending total"),
            onCard: cards.has(row.accountId),
          },
        ]
      : [],
  );
}

/** Transfers from a funding account to a credit-card account, one row per day. */
async function cardPaymentsSince(
  db: V2DbExecutor,
  ledgerId: string,
  fundingAccountIds: readonly string[],
  cardAccountIds: readonly string[],
  range: DateRange,
): Promise<BudgetFacts["cardPayments"]> {
  if (fundingAccountIds.length === 0 || cardAccountIds.length === 0) return [];
  const rows = await db
    .select({
      date: v2Transaction.date,
      amountMinor: sql<string>`sum(${v2Transaction.amountMinor})`,
    })
    .from(v2Transaction)
    .where(
      and(
        eq(v2Transaction.ledgerId, ledgerId),
        eq(v2Transaction.kind, "transfer"),
        gte(v2Transaction.date, range.from),
        lte(v2Transaction.date, range.to),
        inArray(v2Transaction.accountId, [...fundingAccountIds]),
        inArray(v2Transaction.toAccountId, [...cardAccountIds]),
      ),
    )
    .groupBy(v2Transaction.date);
  return rows.map((row) => ({
    date: row.date,
    amountMinor: safeMinor(row.amountMinor, "Card payment total"),
  }));
}

function paydayChange(row: typeof v2BudgetPayday.$inferSelect): PaydayChange {
  return {
    effectiveFrom: row.effectiveFrom,
    rule:
      row.kind === "day" && row.day !== null
        ? { kind: "day", day: row.day }
        : { kind: "last_workday" },
  };
}

function budgetRow(row: BudgetRow): V2Budget {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    currency: row.currency,
    activationPeriodStart: row.activationPeriodStart,
    usualSalaryMinor:
      row.usualSalaryMinor === null ? null : safeMinor(row.usualSalaryMinor, "Usual salary"),
    paydayReminder: row.paydayReminder,
    defaultAccountId: row.defaultAccountId,
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function envelopeRow(row: EnvelopeRow & { readonly categoryIds: readonly string[] }): V2Envelope {
  return {
    id: row.id,
    name: row.name,
    group: row.group,
    startFresh: row.startFresh,
    targetMinor: row.targetMinor === null ? null : safeMinor(row.targetMinor, "Envelope target"),
    dueDate: row.dueDate,
    repeat: row.repeat,
    archived: row.lifecycle === "archived",
    sortOrder: row.sortOrder,
    categoryIds: row.categoryIds,
    version: row.version,
  };
}
