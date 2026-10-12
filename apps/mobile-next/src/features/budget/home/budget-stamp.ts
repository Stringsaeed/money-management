import { format } from "date-fns";

import { parseDateKey } from "@/utils/date";

/** The header's date stamp: "SUN 11.10.26". */
export function stampDate(date: Date): string {
  return format(date, "EEE dd.MM.yy").toUpperCase();
}

/** Budget home's stamp for a Ledger Date, marked on payday: "SUN 25.10.26 · PAYDAY". */
export function budgetStamp(today: string, periodStart: string): string {
  const date = parseDateKey(today);
  const stamp = date ? stampDate(date) : today;
  return today === periodStart ? `${stamp} · PAYDAY` : stamp;
}
