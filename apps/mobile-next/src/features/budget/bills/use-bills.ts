import type { V2Envelope } from "@trove/api/v2/contracts";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { compactAmount } from "@/ui/trove";

import { budgetToday } from "../due/due-model";
import { useDue } from "../due/use-due";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { codeAmount } from "./bills-copy";
import {
  billRows,
  billsMonthSummary,
  dueByEnvelope,
  firstDueByEnvelope,
  savingNeedingAttention,
  savingRows,
  savingsSummary,
} from "./bills-model";
import type { BillsSummaryData } from "./bills-summary";
import { envelopeEmoji, envelopeTileIcon } from "./envelope-tile";

/** Everything B1 shows for both tabs, from the budget view and the shared Due list. */
export function useBills(view: ActiveBudgetView) {
  const { currency } = view.budget;
  const today = budgetToday(view.current);
  const lines = envelopeLines(view);
  // The same Due list Budget home reads; its `through` reaches past this period's end.
  const due = useDue(view);
  const dueLoaded = due.loaded && !due.isError;
  const periodEnd = view.current.period.end;
  const bills = billRows(
    lines,
    dueLoaded ? dueByEnvelope(due.items, view.envelopes, currency, periodEnd) : undefined,
    dueLoaded ? firstDueByEnvelope(due.items, view.envelopes, currency, periodEnd) : undefined,
  );
  const savings = savingRows(lines);
  const categories = useCategoriesQuery();
  const iconByCategoryId = new Map(
    categories.data.map((category): [string, string] => [category.id, category.icon]),
  );

  const month = billsMonthSummary(bills);
  const year = savingsSummary(savings);
  const figure = (minor: number) => compactAmount(minor, currency);
  const monthSummary = {
    lines: [
      { label: "BILLS THIS MONTH", value: figure(month.totalMinor) },
      { label: `PAID · ${month.paidCount} OF ${month.count}`, value: figure(month.paidMinor) },
    ],
    total: { label: "STILL TO PAY", value: codeAmount(month.stillToPayMinor, currency) },
  } satisfies BillsSummaryData;
  const yearSummary = {
    lines: [
      { label: "SET ASIDE SO FAR", value: figure(year.setAsideMinor) },
      { label: "STILL TO SET ASIDE", value: figure(year.stillToSetAsideMinor) },
    ],
    total: { label: "EACH PAYDAY", value: codeAmount(year.perPaydayMinor, currency) },
  } satisfies BillsSummaryData;

  return {
    currency,
    today,
    due,
    bills,
    savings,
    monthSummary,
    yearSummary,
    attention: savingNeedingAttention(savings),
    iconFor: (envelope: V2Envelope) => envelopeTileIcon(envelope, iconByCategoryId),
    emojiFor: (envelope: V2Envelope) => envelopeEmoji(envelope, iconByCategoryId),
  };
}
