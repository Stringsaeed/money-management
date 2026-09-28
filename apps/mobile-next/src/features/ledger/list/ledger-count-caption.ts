import type { V2TransactionSummary } from "@trove/api/v2/contracts";

import { formatNet } from "./ledger-row-display";

/** "1,000 entries · +AED 2,084.00" for the filtered set; net only when single-currency. */
export function ledgerCountCaption(summary: V2TransactionSummary | undefined): string {
  if (!summary) return " ";
  const entries = `${summary.count.toLocaleString()} ${summary.count === 1 ? "entry" : "entries"}`;
  const total = summary.totals.length === 1 ? summary.totals[0] : undefined;
  return total ? `${entries} · ${formatNet(total.netMinor, total.currency)} net` : entries;
}
