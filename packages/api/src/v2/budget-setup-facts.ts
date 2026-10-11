import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { format, parseISO, subDays } from "date-fns";

import { periodContaining, type PaydayRule } from "@trove/domain/budget";
import { v2Account, v2Category, v2RecurringRule, v2Transaction } from "@trove/db/schema/v2-ledger";

import { balancesAsOf } from "./budget";
import { BUDGET_CURRENCY, type V2BudgetSetupFacts } from "./contracts";
import { safeMinor, type V2LedgerContext } from "./shared";

/**
 * `GET /budget/setup-facts` (#367 S2-S4): what the setup flow needs to suggest
 * envelopes and preview "Left to plan" before a budget exists. AED only;
 * every read is grouped or limited.
 */

const RECURRING_EXPENSE_LIMIT = 50;
const TOP_CATEGORY_LIMIT = 8;
const TOP_CATEGORY_WINDOW_DAYS = 90;

export async function getBudgetSetupFacts(
  context: V2LedgerContext,
  rule: PaydayRule,
  today: string,
): Promise<V2BudgetSetupFacts> {
  const { db, ledgerId } = context;
  const period = periodContaining(rule, today);
  const lastPeriod = periodContaining(rule, dayBefore(period.start));
  const aedExpense = and(
    eq(v2Transaction.ledgerId, ledgerId),
    eq(v2Transaction.kind, "expense"),
    eq(v2Transaction.currency, BUDGET_CURRENCY),
  );
  const activeAccounts = await db
    .select({ id: v2Account.id })
    .from(v2Account)
    .where(and(eq(v2Account.ledgerId, ledgerId), eq(v2Account.lifecycle, "active")))
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
      .where(and(aedExpense, gte(v2Transaction.date, period.start), lte(v2Transaction.date, today)))
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
          eq(v2Transaction.currency, BUDGET_CURRENCY),
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
          aedExpense,
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
    })),
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

function dayBefore(date: string): string {
  return format(subDays(parseISO(date), 1), "yyyy-MM-dd");
}
