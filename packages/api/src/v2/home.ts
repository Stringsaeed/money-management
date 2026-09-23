import { format, endOfMonth, startOfMonth } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";

import { v2Transaction } from "@trove/db/schema/v2-ledger";

import { listAccounts } from "./accounts";
import { type V2Home } from "./contracts";
import { listTransactions } from "./transactions";
import { safeMinor, type V2LedgerContext } from "./shared";

export async function getHome(
  context: V2LedgerContext,
  options: { readonly date?: Date; readonly recentLimit?: number } = {},
): Promise<V2Home> {
  const date = options.date ?? new Date();
  const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
  const [accounts, recent, totalsRows] = await Promise.all([
    listAccounts(context),
    listTransactions(context, { limit: Math.min(Math.max(options.recentLimit ?? 20, 1), 100) }),
    context.db
      .select({
        currency: v2Transaction.currency,
        kind: v2Transaction.kind,
        amountMinor: v2Transaction.amountMinor,
      })
      .from(v2Transaction)
      .where(
        and(
          eq(v2Transaction.ledgerId, context.ledgerId),
          gte(v2Transaction.date, monthStart),
          lte(v2Transaction.date, monthEnd),
        ),
      ),
  ]);

  const totalsByCurrency = new Map<string, { incomeMinor: number; expenseMinor: number }>();
  for (const row of totalsRows) {
    if (row.kind === "transfer") continue;
    const current = totalsByCurrency.get(row.currency) ?? { incomeMinor: 0, expenseMinor: 0 };
    const amount = safeMinor(row.amountMinor, "Home transaction amount");
    if (row.kind === "income") current.incomeMinor += amount;
    if (row.kind === "expense") current.expenseMinor += amount;
    totalsByCurrency.set(row.currency, current);
  }

  return {
    ledgerId: context.ledgerId,
    accounts,
    totals: [...totalsByCurrency.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, value]) => ({
        currency,
        ...value,
        netMinor: value.incomeMinor - value.expenseMinor,
      })),
    recentTransactions: recent.items,
  };
}
