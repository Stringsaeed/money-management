import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";

import { DashedRule, LeaderLine, ReceiptTotal } from "@/ui/trove";

import type { SavingPreview } from "./big-payment-model";
import { previewReceipt } from "./preview-receipt";
import { ReceiptSentence } from "./receipt-sentence";

interface SavingPreviewLinesProps {
  readonly preview: SavingPreview;
  readonly dueDate: string;
  readonly repeat: V2EnvelopeRepeat;
  readonly currency: string;
}

/** The printed lines of B2's receipt once there is something to work out. */
export function SavingPreviewLines({
  preview,
  dueDate,
  repeat,
  currency,
}: SavingPreviewLinesProps) {
  const receipt = previewReceipt({ preview, dueDate, repeat, currency });
  return (
    <>
      {receipt.lines.map((line) => (
        <LeaderLine key={line.label} label={line.label} value={line.value} />
      ))}
      <DashedRule />
      <ReceiptTotal
        label={receipt.total.label}
        size="lg"
        toneLabel
        tone={receipt.total.tone}
        value={receipt.total.value}
      />
      <ReceiptSentence text={receipt.sentence} />
    </>
  );
}
