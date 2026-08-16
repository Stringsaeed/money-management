import { Pressable, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { UpcomingRecurringPayment } from "@/utils/recurring";
import { formatUpcomingOccurrence } from "@/utils/recurring";

interface UpcomingRecurringRowProps {
  item: UpcomingRecurringPayment;
  today: string;
  onPress: () => void;
}

const INTERVAL_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
} as const;

const TYPE_EMOJI = {
  expense: "🧾",
  income: "💰",
  transfer: "🔁",
} as const;

export function UpcomingRecurringRow({ item, today, onPress }: UpcomingRecurringRowProps) {
  const { payment, occurrenceDate } = item;

  return (
    <Pressable
      accessibilityLabel={`${payment.name}, ${formatUpcomingOccurrence(occurrenceDate, today)}`}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-dim"
      onPress={onPress}
    >
      <View className="size-10 items-center justify-center rounded-full bg-surface">
        <Text className="text-lg">{TYPE_EMOJI[payment.type]}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-semibold text-sm text-ink" numberOfLines={1}>
          {payment.name}
        </Text>
        <Text className="font-body-normal text-xs text-ink/40">
          {INTERVAL_LABELS[payment.interval]} · {formatUpcomingOccurrence(occurrenceDate, today)}
        </Text>
      </View>
      <MoneyText
        cents={payment.amount}
        currency={payment.currency}
        sign={payment.type === "income" ? "+" : payment.type === "expense" ? "−" : ""}
        className={cn(
          "font-heading-medium text-base",
          payment.type === "income" ? "text-sage" : "text-ink",
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      />
    </Pressable>
  );
}
