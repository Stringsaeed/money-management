import { DashedRule, LeaderLine, RECEIPT_PADDING, ReceiptSlip, ReceiptTotal } from "@/ui/trove";

import { receiptDate } from "./payday-copy";
import { codeAmount, signedCompact } from "./payday-money";
import type { MoneyToPlan } from "./plan-month-model";

interface MoneyToPlanReceiptProps {
  readonly currency: string;
  readonly periodStart: string;
  /** Not planned yet. */
  readonly totalMinor: number;
  /** The lines behind it; `null` prints the total alone. */
  readonly lines: MoneyToPlan | null;
}

/** Money to plan as a receipt: income, last month's unplanned money, plans so far, the total. */
export function MoneyToPlanReceipt({
  currency,
  periodStart,
  totalMinor,
  lines,
}: MoneyToPlanReceiptProps) {
  return (
    <ReceiptSlip gap={7} padding={RECEIPT_PADDING.screen} tearDepth={8}>
      {lines ? (
        <>
          <LeaderLine
            emoji="💰"
            label={`INCOME SINCE ${receiptDate(periodStart)}`}
            value={signedCompact(lines.incomeMinor, currency)}
          />
          <LeaderLine
            emoji="🫙"
            label="NOT PLANNED LAST MONTH"
            value={signedCompact(lines.carriedMinor, currency)}
          />
          {lines.plannedMinor !== 0 ? (
            <LeaderLine
              emoji="✏️"
              label="PLANNED SO FAR"
              value={signedCompact(-lines.plannedMinor, currency)}
            />
          ) : null}
          <DashedRule />
        </>
      ) : null}
      <ReceiptTotal
        label="MONEY TO PLAN"
        tone={totalMinor < 0 ? "neg" : "ok"}
        value={codeAmount(totalMinor, currency)}
      />
    </ReceiptSlip>
  );
}
