import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { MoveMoneyPreview } from "@/modules/budgeting/budgeting";

import { styles } from "./styles";

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
          style={styles.textDestructiveAlert}
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
      entering={FadeIn}
      exiting={FadeOut}
      layout={layoutTransition}
      style={styles.previewCard}
    >
      <Text style={styles.textMediumInkSm}>
        Source {preview.source.before.amountMinor} → {preview.source.after.amountMinor}
      </Text>
      <Text style={styles.textMediumInkSm}>
        Destination {preview.destination.before.amountMinor} →{" "}
        {preview.destination.after.amountMinor}
      </Text>
      <Text style={styles.textNormalXsInk60}>
        Deficit routing: {preview.deficitRouting.cashOverspendingMinor} cash,{" "}
        {preview.deficitRouting.unfundedCardSpendingMinor} card,{" "}
        {preview.deficitRouting.newAvailabilityMinor} new availability.
      </Text>
    </Animated.View>
  );
}
