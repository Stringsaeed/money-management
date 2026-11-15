import { DashedRule, LeaderLine, RECEIPT_PADDING, ReceiptSlip, ReceiptStamp } from "@/ui/trove";

import { onPlanStamp, wrapUpLines } from "./wrap-up-copy";
import type { WrapUpSummary } from "./wrap-up-model";

interface WrapUpReceiptProps {
  readonly summary: WrapUpSummary;
  readonly firstMonth: boolean;
  readonly currency: string;
}

/** Last month on a receipt: the ON PLAN stamp, a rule, then Everyday, Bills and set-aside lines. */
export function WrapUpReceipt({ summary, firstMonth, currency }: WrapUpReceiptProps) {
  return (
    <ReceiptSlip gap={7} padding={RECEIPT_PADDING.screen} tearDepth={8}>
      <ReceiptStamp label={onPlanStamp(summary)} size="md" />
      <DashedRule />
      {wrapUpLines(summary, firstMonth, currency).map((line) => (
        <LeaderLine
          emoji={line.emoji}
          key={line.key}
          label={line.label}
          tone={line.over ? "negative" : "ink"}
          value={line.value}
        />
      ))}
    </ReceiptSlip>
  );
}
