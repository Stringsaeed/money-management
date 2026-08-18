import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { MoveMoneyPreview } from "@/modules/budgeting/budgeting";

interface MoveMoneyPreviewCardProps {
  error: string | null;
  preview: MoveMoneyPreview | null;
}

export function MoveMoneyPreviewCard({ error, preview }: MoveMoneyPreviewCardProps) {
  if (error) {
    return (
      <Text
        accessibilityLiveRegion="polite"
        role="alert"
        selectable
        className="text-sm text-destructive"
      >
        {error}
      </Text>
    );
  }
  if (!preview) return null;
  return (
    <View accessibilityLiveRegion="polite" className="gap-1 rounded-xl bg-surface-container p-4">
      <Text className="font-body-medium text-sm text-ink">
        Source {preview.source.before.amountMinor} → {preview.source.after.amountMinor}
      </Text>
      <Text className="font-body-medium text-sm text-ink">
        Destination {preview.destination.before.amountMinor} →{" "}
        {preview.destination.after.amountMinor}
      </Text>
      <Text className="font-body-normal text-xs text-ink/60">
        Deficit routing: {preview.deficitRouting.cashOverspendingMinor} cash,{" "}
        {preview.deficitRouting.unfundedCardSpendingMinor} card,{" "}
        {preview.deficitRouting.newAvailabilityMinor} new availability.
      </Text>
    </View>
  );
}
