import { format } from "date-fns";

import { parseDateKey } from "@/utils/date";

/** "Wed 14 Oct" for a Ledger Date; the raw value if it does not parse. */
export function dueDateLabel(date: string): string {
  const parsed = parseDateKey(date);
  return parsed ? format(parsed, "EEE d MMM") : date;
}
