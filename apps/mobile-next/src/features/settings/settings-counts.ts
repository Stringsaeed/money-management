import type { LedgerQueryResult } from "@/data/ledger-queries";

/** A row's count value: how many rows pass `isShown`, or nothing while loading or after an error. */
export function countValue<T>(
  query: Pick<LedgerQueryResult<T>, "data" | "isLoading" | "isError">,
  isShown: (row: T) => boolean,
): string | undefined {
  if (query.isLoading || query.isError) return undefined;
  return String(query.data.filter(isShown).length);
}

/** Matches what the Accounts and Categories screens list by default. */
export const isUnarchived = (row: { readonly archived: boolean }) => !row.archived;

/** Matches the Recurring screen's "current" filter. */
export const isCurrentRule = (rule: { readonly lifecycle: string }) =>
  rule.lifecycle !== "archived";
