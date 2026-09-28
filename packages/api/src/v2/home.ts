import { format, endOfMonth, startOfMonth } from "date-fns";
import { and, eq, gte, inArray, lt, lte, or, sql } from "drizzle-orm";

import { v2Transaction } from "@trove/db/schema/v2-ledger";

import { listAccounts } from "./accounts";
import { type V2Home, type V2HomeOverviewBuckets } from "./contracts";
import { listTransactions, summarizeTransactions } from "./transactions";
import { safeMinor, type V2LedgerContext } from "./shared";

export async function getHome(
  context: V2LedgerContext,
  options: {
    readonly date?: Date;
    readonly recentLimit?: number;
    readonly accountIds?: readonly string[];
    readonly currency?: string;
    readonly from?: string;
    readonly to?: string;
  } = {},
): Promise<V2Home> {
  const date = options.date ?? new Date();
  const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
  const [accounts, recent, monthly] = await Promise.all([
    listAccounts(context),
    listTransactions(context, {
      limit: Math.min(Math.max(options.recentLimit ?? 20, 1), 100),
      accountIds: options.accountIds,
      currency: options.currency,
      from: options.from,
      to: options.to,
    }),
    summarizeTransactions(context, { from: monthStart, to: monthEnd }),
  ]);

  return {
    ledgerId: context.ledgerId,
    accounts,
    totals: monthly.totals.map(({ currency, incomeMinor, expenseMinor, netMinor }) => ({
      currency,
      incomeMinor,
      expenseMinor,
      netMinor,
    })),
    recentTransactions: recent.items,
  };
}

/** Aggregate account effects in SQL; the response grows with chart buckets, not ledger history. */
export async function getHomeOverviewBuckets(
  context: V2LedgerContext,
  options: {
    currency: string;
    accountId?: string;
    from: string;
    to: string;
    range: "week" | "month" | "year";
  },
): Promise<V2HomeOverviewBuckets> {
  const accounts = (await listAccounts(context)).filter(
    (account) =>
      !account.archived &&
      account.currency === options.currency &&
      (!options.accountId || account.id === options.accountId),
  );
  const ids = accounts.map((account) => account.id);
  const opening = accounts.reduce(
    (sum, account) => safeMinor(sum + account.openingBalanceMinor, "Home opening balance"),
    0,
  );
  if (!ids.length) return { openingBalanceMinor: opening, buckets: [] };

  const source = inArray(v2Transaction.accountId, ids);
  const target = inArray(v2Transaction.toAccountId, ids);
  const amount = v2Transaction.amountMinor;
  const delta = sql<number>`sum(case
    when ${v2Transaction.kind} = 'transfer' then
      (case when ${target} then ${amount} else 0 end) -
      (case when ${source} then ${amount} else 0 end)
    when ${source} and ${v2Transaction.kind} = 'income' then ${amount}
    when ${source} and ${v2Transaction.kind} = 'expense' then -${amount}
    else 0 end)`;
  const income = sql<number>`sum(case when ${source} and ${v2Transaction.kind} = 'income' then ${amount} else 0 end)`;
  const expense = sql<number>`sum(case when ${source} and ${v2Transaction.kind} = 'expense' then ${amount} else 0 end)`;
  const base = and(
    eq(v2Transaction.ledgerId, context.ledgerId),
    eq(v2Transaction.currency, options.currency),
    or(source, target),
  );
  const [prior, rows] = await Promise.all([
    context.db
      .select({ delta })
      .from(v2Transaction)
      .where(and(base, lt(v2Transaction.date, options.from))),
    context.db
      .select({ date: v2Transaction.date, delta, income, expense })
      .from(v2Transaction)
      .where(and(base, gte(v2Transaction.date, options.from), lte(v2Transaction.date, options.to)))
      .groupBy(v2Transaction.date)
      .orderBy(v2Transaction.date),
  ]);
  return {
    openingBalanceMinor: safeMinor(opening + Number(prior[0]?.delta ?? 0), "Home opening balance"),
    buckets: rows.map((row) => ({
      date: row.date,
      deltaMinor: safeMinor(row.delta, "Home balance change"),
      incomeMinor: safeMinor(row.income, "Home income"),
      expenseMinor: safeMinor(row.expense, "Home expense"),
    })),
  };
}
