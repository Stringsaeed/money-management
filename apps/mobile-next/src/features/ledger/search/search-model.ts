import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from "date-fns";

import type { TransactionListFilters } from "@/data/ledger-client";

export type SearchDateOption = "any" | "this-month" | "last-month" | "last-3-months" | "this-year";

export interface LedgerSearchState {
  readonly query: string;
  readonly date: SearchDateOption;
  readonly accountId: string | null;
  readonly categoryId: string | null;
  readonly recurring: boolean;
}

export const EMPTY_SEARCH: LedgerSearchState = {
  query: "",
  date: "any",
  accountId: null,
  categoryId: null,
  recurring: false,
};

/** The date sheet's choices, in order. */
export const SEARCH_DATE_OPTIONS: readonly {
  readonly option: SearchDateOption;
  readonly label: string;
}[] = [
  { option: "any", label: "Any time" },
  { option: "this-month", label: "This month" },
  { option: "last-month", label: "Last month" },
  { option: "last-3-months", label: "Last 3 months" },
  { option: "this-year", label: "This year" },
];

const key = (date: Date) => format(date, "yyyy-MM-dd");

interface SearchRange {
  readonly from: Date;
  readonly to: Date;
  /** Runs through today: labelled "Since …" rather than by its months. */
  readonly openEnded: boolean;
}

function searchRange(option: SearchDateOption, today: Date): SearchRange | null {
  switch (option) {
    case "any":
      return null;
    case "this-month":
      return { from: startOfMonth(today), to: endOfMonth(today), openEnded: true };
    case "last-month": {
      const month = subMonths(today, 1);
      return { from: startOfMonth(month), to: endOfMonth(month), openEnded: false };
    }
    case "last-3-months":
      return { from: startOfMonth(subMonths(today, 2)), to: endOfMonth(today), openEnded: true };
    case "this-year":
      return { from: startOfYear(today), to: endOfYear(today), openEnded: true };
  }
}

/** The date chip's label: `Any time`, `Since Aug`, or a closed month like `Sep`. */
export function dateChipLabel(option: SearchDateOption, today: Date): string {
  const range = searchRange(option, today);
  if (!range) return "Any time";
  const month = format(range.from, "MMM");
  return range.openEnded ? `Since ${month}` : month;
}

/** True once there is something to search for: a query or any filter. */
export function isSearching(state: LedgerSearchState): boolean {
  return (
    state.query.trim().length > 0 ||
    state.date !== "any" ||
    state.accountId !== null ||
    state.categoryId !== null ||
    state.recurring
  );
}

export function searchFilters(state: LedgerSearchState, today: Date): TransactionListFilters {
  const range = searchRange(state.date, today);
  return {
    accountIds: state.accountId ? [state.accountId] : [],
    categoryIds: state.categoryId ? [state.categoryId] : [],
    from: range ? key(range.from) : null,
    to: range ? key(range.to) : null,
    search: state.query,
    recurring: state.recurring,
  };
}

/** The results strip: `5 RESULTS · SINCE AUG`, `1 RESULT · ANY TIME`. */
export function resultsStamp(count: number, option: SearchDateOption, today: Date): string {
  const noun = count === 1 ? "RESULT" : "RESULTS";
  return `${count.toLocaleString("en-US")} ${noun} · ${dateChipLabel(option, today).toUpperCase()}`;
}
