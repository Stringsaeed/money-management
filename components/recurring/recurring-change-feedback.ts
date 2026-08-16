import { Alert } from "react-native";

import type { RecurringChangeResult } from "@/modules/recurring-rules";
import { formatCents } from "@/utils/currency";

export function presentRecurringPreview(
  result: Extract<RecurringChangeResult, { kind: "preview_required" }>,
  options: { title: string; confirmLabel: string; onConfirm: () => Promise<void> },
) {
  const { preview } = result;
  Alert.alert(
    options.title,
    `${preview.count} ${preview.count === 1 ? "transaction" : "transactions"} from ${preview.firstDate} to ${preview.lastDate} will be added now, totaling ${formatCents(preview.totalMinor, preview.currency)}.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: options.confirmLabel,
        onPress: () => {
          void options.onConfirm().catch(() => {
            Alert.alert("Couldn't Update Rule", "Nothing was changed. Please try again.");
          });
        },
      },
    ],
  );
}

export function recurringChangeFailureMessage(result: RecurringChangeResult): string {
  if (result.kind === "invalid_intent") {
    return result.issues.map(({ message }) => message).join(" ");
  }
  if (result.kind === "stale_revision") {
    return "This Recurring Rule changed elsewhere. Reopen it and try again.";
  }
  if (result.kind === "needs_attention") {
    return "Repair this Recurring Rule before continuing.";
  }
  return "The Recurring Rule is no longer available.";
}
