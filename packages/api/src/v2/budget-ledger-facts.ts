import { and, asc, count, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { format, parseISO, subDays } from "date-fns";
import { Context, Effect, Layer } from "effect";

import type { BudgetFacts, BudgetPeriod } from "@trove/domain/budget";
import { v2Account, v2Category, v2RecurringRule, v2Transaction } from "@trove/db/schema/v2-ledger";

import { storeFailure } from "./budget-errors";
import { BudgetLedger, LedgerDb } from "./budget-services";
import type { transactionCreateSchema, V2BudgetSetupFacts } from "./contracts";
import { safeMinor, type V2DbExecutor } from "./shared";
import { insertTransaction } from "./transactions";

/**
 * What the budget reads from, and the few rows it writes into, the ledger the
 * Hono V2 routes own: Accounts, Categories, Transactions, and Recurring Rules.
 * Every read is ledger-scoped and grouped or limited.
 */

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

export type AccountRow = typeof v2Account.$inferSelect;
export type NewExpense = ReturnType<typeof transactionCreateSchema.parse>;

const RECURRING_EXPENSE_LIMIT = 50;
const TOP_CATEGORY_LIMIT = 8;
const TOP_CATEGORY_WINDOW_DAYS = 90;

const make = Effect.gen(function* () {
  const db = yield* LedgerDb;
  const ledger = yield* BudgetLedger;
  const { ledgerId } = ledger;
  const run = <A>(operation: string, query: (db: V2DbExecutor) => PromiseLike<A>) =>
    Effect.tryPromise({ try: () => query(db), catch: storeFailure(operation) });

  return {
    /** Opening balance plus every transaction dated on or before `today`. */
    balancesAsOf: (accountIds: readonly string[], today: string) =>
      run("ledger.balancesAsOf", (db) => balancesAsOf(db, ledgerId, accountIds, today)),

    /** Every credit-card account in `currency`, archived ones included (their spending still counts). */
    cardAccountIds: (currency: string) =>
      run("ledger.cardAccountIds", (db) => cardAccountIds(db, ledgerId, currency)),

    /** What the cards owed just before `periodStart`, never below zero. */
    openingCardDebt: (cardIds: readonly string[], periodStart: string) =>
      run("ledger.openingCardDebt", (db) => openingCardDebt(db, ledgerId, cardIds, periodStart)),

    spending: (
      categoryIds: readonly string[],
      fundingIds: readonly string[],
      cardIds: readonly string[],
      range: DateRange,
    ) =>
      run("ledger.spending", (db) =>
        spending(db, ledgerId, categoryIds, fundingIds, cardIds, range),
      ),

    cardPayments: (fundingIds: readonly string[], cardIds: readonly string[], range: DateRange) =>
      run("ledger.cardPayments", (db) => cardPayments(db, ledgerId, fundingIds, cardIds, range)),

    accountsByIds: (accountIds: readonly string[]) =>
      run("ledger.accountsByIds", (db) =>
        db
          .select()
          .from(v2Account)
          .where(and(eq(v2Account.ledgerId, ledgerId), inArray(v2Account.id, [...accountIds]))),
      ),

    activeExpenseCategories: run("ledger.activeExpenseCategories", (db) =>
      db
        .select({ id: v2Category.id, name: v2Category.name })
        .from(v2Category)
        .where(
          and(
            eq(v2Category.ledgerId, ledgerId),
            eq(v2Category.kind, "expense"),
            eq(v2Category.lifecycle, "active"),
          ),
        ),
    ),

    insertExpenseCategory: (id: string, name: string, icon?: string) =>
      run("ledger.insertExpenseCategory", (db) =>
        db.insert(v2Category).values({
          ledgerId,
          id,
          name,
          ...(icon && { icon }),
          kind: "expense",
          createdBy: ledger.ownerId,
          updatedBy: ledger.ownerId,
        }),
      ),

    insertCashAccount: (id: string, name: string, currency: string, openingBalanceMinor: number) =>
      run("ledger.insertCashAccount", (db) =>
        db.insert(v2Account).values({
          ledgerId,
          id,
          name,
          type: "cash",
          currency,
          openingBalanceMinor,
          createdBy: ledger.ownerId,
          updatedBy: ledger.ownerId,
        }),
      ),

    /** Records a Transaction through the V2 Transaction rules; must run inside a ledger mutation. */
    insertTransaction: (parsed: NewExpense) =>
      run("ledger.insertTransaction", (db) => insertTransaction(db, ledger, parsed)),

    setupFacts: (currency: string, period: BudgetPeriod, lastPeriod: BudgetPeriod, today: string) =>
      run("ledger.setupFacts", (db) =>
        setupFacts(db, ledgerId, currency, period, lastPeriod, today),
      ),
  };
});

export class LedgerFacts extends Context.Service<LedgerFacts, Effect.Success<typeof make>>()(
  "@trove/api/v2/LedgerFacts",
) {
  static readonly layer = Layer.effect(LedgerFacts, make);
}

async function balancesAsOf(
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

async function cardAccountIds(
  db: V2DbExecutor,
  ledgerId: string,
  currency: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: v2Account.id })
    .from(v2Account)
    .where(
      and(
        eq(v2Account.ledgerId, ledgerId),
        eq(v2Account.type, "credit_card"),
        eq(v2Account.currency, currency),
      ),
    );
  return rows.map((row) => row.id);
}

/**
 * What the cards owed just before `periodStart`: their balances counting every transaction
 * dated before it, negated (a card balance is negative while it owes), never below zero.
 */
async function openingCardDebt(
  db: V2DbExecutor,
  ledgerId: string,
  cardIds: readonly string[],
  periodStart: string,
): Promise<number> {
  const balances = await balancesAsOf(db, ledgerId, cardIds, dayBefore(periodStart));
  let balanceMinor = 0;
  for (const value of balances.values()) balanceMinor += value;
  return Math.max(-balanceMinor, 0);
}

/**
 * Expenses in mapped Categories from funding accounts plus EVERY expense from a credit-card
 * account (mapped or not, so unmapped card spending is reserved), one row per day/category/account.
 */
async function spending(
  db: V2DbExecutor,
  ledgerId: string,
  categoryIds: readonly string[],
  fundingIds: readonly string[],
  cardIds: readonly string[],
  range: DateRange,
): Promise<BudgetFacts["spending"]> {
  const fromFunding =
    categoryIds.length === 0 || fundingIds.length === 0
      ? undefined
      : and(
          inArray(v2Transaction.categoryId, [...categoryIds]),
          inArray(v2Transaction.accountId, [...fundingIds]),
        );
  const fromCard =
    cardIds.length === 0 ? undefined : inArray(v2Transaction.accountId, [...cardIds]);
  if (!fromFunding && !fromCard) return [];
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
        or(fromFunding, fromCard),
      ),
    )
    .groupBy(v2Transaction.date, v2Transaction.categoryId, v2Transaction.accountId);
  const cards = new Set(cardIds);
  return rows.map((row) => ({
    date: row.date,
    categoryId: row.categoryId,
    amountMinor: safeMinor(row.amountMinor, "Spending total"),
    onCard: cards.has(row.accountId),
  }));
}

/** Transfers from a funding account to a credit-card account, one row per day. */
async function cardPayments(
  db: V2DbExecutor,
  ledgerId: string,
  fundingIds: readonly string[],
  cardIds: readonly string[],
  range: DateRange,
): Promise<BudgetFacts["cardPayments"]> {
  if (fundingIds.length === 0 || cardIds.length === 0) return [];
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
        inArray(v2Transaction.accountId, [...fundingIds]),
        inArray(v2Transaction.toAccountId, [...cardIds]),
      ),
    )
    .groupBy(v2Transaction.date);
  return rows.map((row) => ({
    date: row.date,
    amountMinor: safeMinor(row.amountMinor, "Card payment total"),
  }));
}

/**
 * `GET /budget/setup-facts` reads (#367 S2-S4): what the setup flow needs to
 * suggest envelopes and preview "Left to plan" before a budget exists. Only
 * `currency`'s accounts, spending, card payments, and recurring expenses.
 */
async function setupFacts(
  db: V2DbExecutor,
  ledgerId: string,
  currency: string,
  period: BudgetPeriod,
  lastPeriod: BudgetPeriod,
  today: string,
): Promise<V2BudgetSetupFacts> {
  const expenseInCurrency = and(
    eq(v2Transaction.ledgerId, ledgerId),
    eq(v2Transaction.kind, "expense"),
    eq(v2Transaction.currency, currency),
  );
  const activeAccounts = await db
    .select({ id: v2Account.id })
    .from(v2Account)
    .where(
      and(
        eq(v2Account.ledgerId, ledgerId),
        eq(v2Account.lifecycle, "active"),
        eq(v2Account.currency, currency),
      ),
    )
    .orderBy(asc(v2Account.name), asc(v2Account.id));

  const [balances, spendRows, paymentRows, lastRows, ruleRows, topRows] = await Promise.all([
    balancesAsOf(
      db,
      ledgerId,
      activeAccounts.map((row) => row.id),
      today,
    ),
    db
      .select({
        categoryId: v2Transaction.categoryId,
        accountId: v2Transaction.accountId,
        amountMinor: sql<string>`sum(${v2Transaction.amountMinor})`,
      })
      .from(v2Transaction)
      .where(
        and(
          expenseInCurrency,
          gte(v2Transaction.date, period.start),
          lte(v2Transaction.date, today),
        ),
      )
      .groupBy(v2Transaction.categoryId, v2Transaction.accountId),
    db
      .select({
        fromAccountId: v2Transaction.accountId,
        toAccountId: v2Account.id,
        amountMinor: sql<string>`sum(${v2Transaction.amountMinor})`,
      })
      .from(v2Transaction)
      .innerJoin(
        v2Account,
        and(
          eq(v2Account.ledgerId, v2Transaction.ledgerId),
          eq(v2Account.id, v2Transaction.toAccountId),
        ),
      )
      .where(
        and(
          eq(v2Transaction.ledgerId, ledgerId),
          eq(v2Transaction.kind, "transfer"),
          eq(v2Transaction.currency, currency),
          eq(v2Account.type, "credit_card"),
          gte(v2Transaction.date, period.start),
          lte(v2Transaction.date, today),
        ),
      )
      .groupBy(v2Transaction.accountId, v2Account.id),
    db
      .select({
        categoryId: v2Transaction.categoryId,
        amountMinor: sql<string>`sum(${v2Transaction.amountMinor})`,
      })
      .from(v2Transaction)
      .where(
        and(
          expenseInCurrency,
          gte(v2Transaction.date, lastPeriod.start),
          lte(v2Transaction.date, lastPeriod.end),
        ),
      )
      .groupBy(v2Transaction.categoryId),
    db
      .select()
      .from(v2RecurringRule)
      .where(
        and(
          eq(v2RecurringRule.ledgerId, ledgerId),
          eq(v2RecurringRule.kind, "expense"),
          eq(v2RecurringRule.lifecycle, "active"),
          eq(v2RecurringRule.currency, currency),
        ),
      )
      .orderBy(asc(v2RecurringRule.name), asc(v2RecurringRule.id))
      .limit(RECURRING_EXPENSE_LIMIT),
    db
      .select({ categoryId: v2Category.id, name: v2Category.name, transactionCount: count() })
      .from(v2Category)
      .innerJoin(
        v2Transaction,
        and(
          eq(v2Transaction.ledgerId, v2Category.ledgerId),
          eq(v2Transaction.categoryId, v2Category.id),
        ),
      )
      .where(
        and(
          eq(v2Category.ledgerId, ledgerId),
          eq(v2Category.kind, "expense"),
          eq(v2Category.lifecycle, "active"),
          eq(v2Transaction.kind, "expense"),
          eq(v2Transaction.currency, currency),
          gte(
            v2Transaction.date,
            format(subDays(parseISO(today), TOP_CATEGORY_WINDOW_DAYS), "yyyy-MM-dd"),
          ),
          lte(v2Transaction.date, today),
        ),
      )
      .groupBy(v2Category.id, v2Category.name)
      .orderBy(desc(count()), asc(v2Category.name))
      .limit(TOP_CATEGORY_LIMIT),
  ]);
  const cardIds = await cardAccountIds(db, ledgerId, currency);
  const cards = new Set(cardIds);
  const openingCardDebtMinor = await openingCardDebt(db, ledgerId, cardIds, period.start);

  return {
    today,
    period,
    accountBalances: activeAccounts.map((row) => ({
      accountId: row.id,
      balanceMinor: balances.get(row.id) ?? 0,
    })),
    spendSincePeriodStart: spendRows.map((row) => ({
      categoryId: row.categoryId,
      accountId: row.accountId,
      amountMinor: safeMinor(row.amountMinor, "Spending total"),
      onCard: cards.has(row.accountId),
    })),
    openingCardDebtMinor,
    cardPaymentsSincePeriodStart: paymentRows.map((row) => ({
      fromAccountId: row.fromAccountId,
      toAccountId: row.toAccountId,
      amountMinor: safeMinor(row.amountMinor, "Card payment total"),
    })),
    lastPeriod,
    lastPeriodSpend: lastRows.flatMap((row) =>
      row.categoryId
        ? [
            {
              categoryId: row.categoryId,
              amountMinor: safeMinor(row.amountMinor, "Spending total"),
            },
          ]
        : [],
    ),
    recurringExpenses: ruleRows.map((row) => ({
      ruleId: row.id,
      name: row.name,
      amountMinor: safeMinor(row.amountMinor, "Recurring amount"),
      currency: row.currency,
      categoryId: row.categoryId,
      frequency: row.frequency,
      intervalCount: row.intervalCount,
    })),
    topCategories: topRows,
  };
}

export function dayBefore(date: string): string {
  return format(subDays(parseISO(date), 1), "yyyy-MM-dd");
}
