import { Pressable, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { RecurringRule } from "@/modules/recurring-rules";
import { formatRecurrence } from "@/utils/recurring";

interface RecurringRuleRowProps {
  rule: RecurringRule;
  onPress: VoidFunction;
}

const TYPE_EMOJI = {
  expense: "🧾",
  income: "💰",
  transfer: "🔁",
} as const;

const lifecycleLabel: Record<RecurringRule["lifecycle"], string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
  completed: "Completed",
};

export function RecurringRuleRow({ rule, onPress }: RecurringRuleRowProps) {
  const subtitle = `${formatRecurrence(rule)} · ${lifecycleLabel[rule.lifecycle]}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      className="flex-row items-center gap-3 px-5 py-3.5 active:bg-surface-container/50"
      onPress={onPress}
    >
      <View className="size-10 items-center justify-center rounded-full bg-surface-container">
        <Text className="text-lg">
          {rule.health === "needs_attention" ? "⚠️" : TYPE_EMOJI[rule.type]}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-semibold text-sm text-ink" numberOfLines={1}>
          {rule.name}
        </Text>
        <Text
          className={cn(
            "font-body-normal text-xs",
            rule.health === "needs_attention" ? "text-terracotta" : "text-ink/40",
          )}
          numberOfLines={1}
        >
          {rule.health === "needs_attention" ? `${subtitle} · Needs attention` : subtitle}
        </Text>
      </View>
      {rule.amountMinor === null ? (
        <Text className="font-body-semibold text-xs text-terracotta">Repair</Text>
      ) : (
        <MoneyText
          cents={rule.amountMinor}
          currency={rule.currency}
          sign={rule.type === "income" ? "+" : rule.type === "expense" ? "−" : ""}
          className={cn(
            "font-heading-medium text-base",
            rule.type === "income" ? "text-sage" : "text-ink",
          )}
          style={{ fontVariant: ["tabular-nums"] }}
        />
      )}
    </Pressable>
  );
}
