import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { RecurringRule } from "@/modules/recurring-rules";

interface RecurringRuleStatusProps {
  rule: RecurringRule;
}

const lifecycleLabel: Record<RecurringRule["lifecycle"], string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
  completed: "Completed",
};

export function RecurringRuleStatus({ rule }: RecurringRuleStatusProps) {
  const needsAttention = rule.health === "needs_attention";
  return (
    <Animated.View
      className="mx-5 mt-2 gap-2 rounded-lg border border-ledger-outline bg-surface-container px-4 py-3"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={layoutTransition}
    >
      <View className="flex-row items-center gap-2">
        <View className="rounded-full bg-surface-dim px-2 py-1">
          <Text className="font-body-semibold text-xs text-ink">
            {lifecycleLabel[rule.lifecycle]}
          </Text>
        </View>
        <View
          className={cn(
            "rounded-full px-2 py-1",
            needsAttention ? "bg-terracotta/15" : "bg-sage/15",
          )}
        >
          <Text
            className={cn(
              "font-body-semibold text-xs",
              needsAttention ? "text-terracotta" : "text-sage",
            )}
          >
            {needsAttention ? "Needs attention" : "Ready"}
          </Text>
        </View>
      </View>
      {needsAttention ? (
        <Text className="font-body-normal text-xs leading-5 text-ink/55">
          Repair the amount and Account details before this Rule can create transactions.
        </Text>
      ) : null}
      {rule.lastSettlementError ? (
        <Text className="font-body-medium text-xs leading-5 text-destructive">
          Last run failed. Save or retry after checking this Rule.
        </Text>
      ) : null}
    </Animated.View>
  );
}
