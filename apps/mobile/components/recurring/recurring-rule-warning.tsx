import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { RecurringRule } from "@/modules/recurring-rules";

interface RecurringRuleWarningProps {
  rule: RecurringRule;
}

export function RecurringRuleWarning({ rule }: RecurringRuleWarningProps) {
  if (rule.health !== "needs_attention") return null;

  return (
    <Animated.View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      className="mx-5 mt-2 gap-1 rounded-lg border border-terracotta/30 bg-terracotta/10 px-4 py-3"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={layoutTransition}
    >
      <Text className="font-body-semibold text-sm text-terracotta">
        ⚠️ Recurring Rule needs attention
      </Text>
      <Text className="font-body-normal text-xs leading-5 text-ink/60">
        Review the amount and Account details, then save to repair this Rule.
      </Text>
    </Animated.View>
  );
}
