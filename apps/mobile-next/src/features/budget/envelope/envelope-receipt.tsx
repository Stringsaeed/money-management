import { DashedRule, LeaderLine, RECEIPT_PADDING, ReceiptSlip, ReceiptTotal } from "@/ui/trove";

import type { ReceiptLine } from "./envelope-display";

interface EnvelopeReceiptProps {
  readonly lines: readonly ReceiptLine[];
  /** Left, printed on the total's marker: `588`, `−175`. */
  readonly left: string;
  readonly over: boolean;
}

/** The envelope's slip: plan, carry and spending, a dashed rule, and Left on its marker. */
export function EnvelopeReceipt({ lines, left, over }: EnvelopeReceiptProps) {
  return (
    <ReceiptSlip gap={7} padding={RECEIPT_PADDING.screen} radius={12} tearDepth={8}>
      {lines.map((line) => (
        <LeaderLine key={line.label} label={line.label} value={line.value} />
      ))}
      <DashedRule />
      <ReceiptTotal label="LEFT" size="lg" tone={over ? "neg" : "ok"} value={left} />
    </ReceiptSlip>
  );
}
