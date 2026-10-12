import { parseISO } from "date-fns";

import { useCategoriesQuery, useTransactionsQuery } from "@/data/ledger-queries";
import { dateKey } from "@/utils/date";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { useDue } from "../due/use-due";
import { useBudgetActivity } from "../household/use-budget-activity";
import { usePayday } from "../payday/use-payday";
import { useBudgetRole } from "../role/use-budget-role";
import { pickAttention } from "./attention";
import { dueThisWeekCount } from "./due-bell-model";
import { envelopeEmoji } from "./envelope-emoji";
import { envelopeLines, type ActiveBudgetView } from "./home-model";
import { dailyEverydaySpend, everydayAllowanceMinor, spendTicks } from "./spend-ticks";
import { billsTicket, savingTicket } from "./summary-tickets-model";
import { useHomeAnalytics } from "./use-home-analytics";

/** Everything Budget home prints, read from the budget, the Due list, payday and activity. */
export function useBudgetHome(view: ActiveBudgetView) {
  const { current } = view;
  const currency = useBudgetCurrency();
  const access = useBudgetRole();
  const due = useDue(view);
  const payday = usePayday(view);
  const activity = useBudgetActivity();
  const categories = useCategoriesQuery();
  const { today } = due;
  const expenses = useTransactionsQuery({
    kind: "expense",
    fromDate: current.period.start,
    toDate: today,
  });

  const lines = envelopeLines(view);
  const firstDue = due.sections.flatMap((section) => section.items)[0];
  const attention = pickAttention({
    envelopes: lines.map(({ envelope, totals }) => ({
      id: envelope.id,
      name: envelope.name,
      leftMinor: totals.leftMinor,
    })),
    unassignedMinor: current.unassignedMinor,
    paydayPending: payday.status.pending,
    paydayLate: payday.status.pending && payday.status.late,
    paydayToday: today === current.period.start,
    dueError: due.isError,
    dueToday: {
      ...due.dueNow,
      name: due.dueNow.count === 1 ? (firstDue?.name ?? null) : null,
    },
    activityToday: activity.items.filter((item) => dateKey(parseISO(item.createdAt)) === today),
  });
  useHomeAnalytics(attention);

  const categoriesById = new Map(categories.data.map((category) => [category.id, category]));
  const saving = savingTicket(lines, currency);

  return {
    currency,
    access,
    due,
    today,
    lines,
    everyday: lines.filter((line) => line.envelope.group === "everyday"),
    attention,
    ticks: spendTicks({
      period: current.period,
      today,
      spendByDay: dailyEverydaySpend(expenses.data, view, currency, today),
      allowanceMinor: everydayAllowanceMinor(view),
    }),
    dueCount: due.loaded && !due.isError ? dueThisWeekCount(due.sections) : 0,
    emojiFor: (envelope: { readonly categoryIds: readonly string[] }) =>
      envelopeEmoji(envelope, categoriesById),
    bills: billsTicket({
      lines,
      envelopes: view.envelopes,
      dueItems: due.items,
      currency,
      today,
      periodEnd: current.period.end,
    }),
    saving,
    savingEmoji: saving.envelope ? envelopeEmoji(saving.envelope, categoriesById) : "🏠",
  };
}

export type BudgetHomeData = ReturnType<typeof useBudgetHome>;
