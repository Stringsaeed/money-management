import type { V2Envelope } from "@trove/api/v2/contracts";

import {
  DashedRule,
  LeaderLine,
  RECEIPT_PADDING,
  ReceiptNote,
  ReceiptSlip,
  ReceiptTotal,
} from "@/ui/trove";

import { plainFigure } from "./bills-copy";
import { afterPayment, afterPaymentSentence, leftAfterValue, nextDueNote } from "./mark-paid-lines";
import { ReceiptSentence } from "./receipt-sentence";

interface MarkPaidReceiptProps {
  readonly envelope: Pick<V2Envelope, "dueDate" | "repeat" | "targetMinor">;
  /** The envelope's Left now. */
  readonly leftMinor: number;
  /** What is being paid, or null while the amount is not a valid figure yet. */
  readonly amountMinor: number | null;
  readonly currency: string;
}

/** B3 receipt: set aside, paying, what is left after, and what comes next. */
export function MarkPaidReceipt({
  envelope,
  leftMinor,
  amountMinor,
  currency,
}: MarkPaidReceiptProps) {
  const after = amountMinor === null ? null : afterPayment(leftMinor, amountMinor);
  return (
    <ReceiptSlip padding={RECEIPT_PADDING.screen} tearDepth={8}>
      <LeaderLine label="SET ASIDE" value={plainFigure(Math.max(leftMinor, 0), currency)} />
      <LeaderLine
        label="PAYING"
        value={amountMinor === null ? "—" : `−${plainFigure(amountMinor, currency)}`}
      />
      {after ? (
        <>
          <DashedRule />
          <ReceiptTotal
            label={after.over ? "OVER AFTER" : "LEFT AFTER"}
            tone={after.over ? "neg" : "ok"}
            toneLabel={after.over}
            value={leftAfterValue(after, currency)}
          />
          <ReceiptSentence text={afterPaymentSentence(after, currency)} />
        </>
      ) : null}
      <DashedRule />
      <ReceiptNote text={nextDueNote(envelope, currency)} />
    </ReceiptSlip>
  );
}
