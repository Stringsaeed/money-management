import { Pressable, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { RecurringRule } from "@/modules/recurring-rules";
import { formatCents } from "@/utils/currency";
import { formatUpcomingOccurrence } from "@/utils/recurring";

interface UpcomingRecurringRowProps {
  rule: RecurringRule;
  occurrenceDate: string;
  today: string;
  onPress: () => void;
}

const TYPE_EMOJI = {
  expense: "🧾",
  income: "💰",
  transfer: "🔁",
} as const;

export function UpcomingRecurringRow({
  rule,
  occurrenceDate,
  today,
  onPress,
}: UpcomingRecurringRowProps) {
  const occurrenceLabel = formatUpcomingOccurrence(occurrenceDate, today);
  const formattedAmount = formatCents(rule.amountMinor ?? 0, rule.currency);
  const amountLabel =
    rule.type === "income"
      ? `plus ${formattedAmount}`
      : rule.type === "expense"
        ? `minus ${formattedAmount}`
        : formattedAmount;

  return (
    <Pressable
      accessibilityLabel={`${rule.name}, ${occurrenceLabel}, ${amountLabel}`}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-dim"
      onPress={onPress}
    >
      <View className="size-10 items-center justify-center rounded-full bg-surface">
        <Text className="text-lg">{TYPE_EMOJI[rule.type]}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-semibold text-sm text-ink" numberOfLines={1}>
          {rule.name}
        </Text>
        <Text className="font-body-normal text-xs text-ink/40">
          {rule.type === "transfer" ? "Transfer" : "Recurring"} · {occurrenceLabel}
        </Text>
      </View>
      <MoneyText
        cents={rule.amountMinor ?? 0}
        currency={rule.currency}
        sign={rule.type === "income" ? "+" : rule.type === "expense" ? "−" : ""}
        className={cn(
          "font-heading-medium text-base",
          rule.type === "income" ? "text-sage" : "text-ink",
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      />
    </Pressable>
  );
}
