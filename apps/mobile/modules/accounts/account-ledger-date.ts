import { isMatch, isValid, parseISO } from "date-fns";

export function accountLifecyclePeriod(localDate: string): string {
  if (!isMatch(localDate, "yyyy-MM-dd") || !isValid(parseISO(localDate))) {
    throw new Error(`Account lifecycle requires a valid local Ledger Date, received ${localDate}.`);
  }
  return localDate.slice(0, 7);
}
