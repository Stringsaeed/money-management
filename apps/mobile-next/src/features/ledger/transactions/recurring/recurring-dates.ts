import { format } from "date-fns";

import { parseDateKey } from "@/utils/date";

/** "10 Oct 2026" for a `yyyy-MM-dd` key; the raw key when it is not a valid date. */
export function formatRecurringDate(dateKey: string): string {
  const parsed = parseDateKey(dateKey);
  return parsed ? format(parsed, "d MMM yyyy") : dateKey;
}
