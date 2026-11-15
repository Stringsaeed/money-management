import { View } from "react-native";

import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";

import { RECEIPT_PADDING, ReceiptSlip } from "@/ui/trove";

import type { SavingPreview as SavingPreviewData } from "./big-payment-model";
import { ReceiptSentence } from "./receipt-sentence";
import { SavingPreviewLines } from "./saving-preview-lines";

interface SavingPreviewProps {
  readonly preview: SavingPreviewData | null;
  readonly dueDate: string;
  readonly repeat: V2EnvelopeRepeat;
  readonly currency: string;
}

/** B2 receipt: what is still needed, over how many paydays, and what to set aside each one. */
export function SavingPreview({ preview, dueDate, repeat, currency }: SavingPreviewProps) {
  return (
    <View accessibilityLiveRegion="polite">
      <ReceiptSlip padding={RECEIPT_PADDING.screen} tearDepth={8}>
        {preview === null ? (
          <ReceiptSentence text="Add an amount and a due date to see what to set aside each payday." />
        ) : (
          <SavingPreviewLines
            preview={preview}
            dueDate={dueDate}
            repeat={repeat}
            currency={currency}
          />
        )}
      </ReceiptSlip>
    </View>
  );
}
