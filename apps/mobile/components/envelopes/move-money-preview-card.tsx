import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { MoveMoneyPreview } from "@/modules/budgeting/budgeting";

interface MoveMoneyPreviewCardProps {
  error: string | null;
  preview: MoveMoneyPreview | null;
}

export function MoveMoneyPreviewCard({ error, preview }: MoveMoneyPreviewCardProps) {
  if (error) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
        <Text
          accessibilityLiveRegion="polite"
          role="alert"
          selectable
          className="text-sm text-destructive"
        >
          {error}
        </Text>
      </Animated.View>
    );
  }
  if (!preview) return null;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      className="gap-1 rounded-xl bg-surface-container p-4"
      entering={FadeIn}
      exiting={FadeOut}
      layout={layoutTransition}
    >
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
    </Animated.View>
  );
}
