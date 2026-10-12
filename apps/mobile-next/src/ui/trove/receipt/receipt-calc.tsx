import { DashedRule } from "./dashed-rule";
import { LeaderLine } from "./leader-line";
import { RECEIPT_PADDING } from "./receipt-padding";
import { ReceiptSlip } from "./receipt-slip";
import { ReceiptStamp } from "./receipt-stamp";
import { ReceiptTotal, type ReceiptTotalTone } from "./receipt-total";

export interface ReceiptCalcLine {
  label: string;
  value: string;
}

export interface ReceiptCalcTotal extends ReceiptCalcLine {
  tone: ReceiptTotalTone;
}

export interface ReceiptCalcProps {
  /** The figure being checked, e.g. MONEY YOU HAVE · 14,200. */
  line: ReceiptCalcLine;
  /** The outcome on its marker, e.g. LEFT TO PLAN · AED 730 (ok). */
  total: ReceiptCalcTotal;
  /** Optional rubber stamp above the line, e.g. "ON PLAN · 10 OF 11". */
  stamp?: string;
  testID?: string;
}

/** Compact calculation receipt: one leader line, a dashed rule and a toned total. */
export function ReceiptCalc({ line, total, stamp, testID }: ReceiptCalcProps) {
  return (
    <ReceiptSlip gap={6} padding={RECEIPT_PADDING.calc} radius={10} tearDepth={8} testID={testID}>
      {stamp ? <ReceiptStamp label={stamp} /> : null}
      <LeaderLine label={line.label} size="sm" value={line.value} valueWeight="label" />
      <DashedRule />
      <ReceiptTotal label={total.label} size="md" toneLabel tone={total.tone} value={total.value} />
    </ReceiptSlip>
  );
}
