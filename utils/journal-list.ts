import type { DayGroup, TransactionWithDetails } from "@/types";

export type SectionHeaderItem = {
  type: "section-header";
  date: string;
  totalIncome: number;
  totalExpense: number;
  currency: string;
};

export type TransactionItem = {
  type: "transaction";
  data: TransactionWithDetails;
  showAccount: boolean;
  isLast: boolean;
};

export type JournalListItem = SectionHeaderItem | TransactionItem;

export function buildJournalList(
  groups: DayGroup[],
  currency: string,
  showAccount: boolean,
): JournalListItem[] {
  const items: JournalListItem[] = [];

  for (const group of groups) {
    items.push({
      type: "section-header",
      date: group.date,
      totalIncome: group.totalIncome,
      totalExpense: group.totalExpense,
      currency,
    });
    group.transactions.forEach((t, i) => {
      items.push({
        type: "transaction",
        data: t,
        showAccount,
        isLast: i === group.transactions.length - 1,
      });
    });
  }

  return items;
}
