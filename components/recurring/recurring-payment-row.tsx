import { Pressable, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { RecurringPayment } from "@/types";
import { formatRecurrence, formatUpcomingOccurrence, getNextOccurrence } from "@/utils/recurring";

interface RecurringPaymentRowProps {
  payment: RecurringPayment;
  today: string;
  onPress: () => void;
}

const TYPE_EMOJI = {
  expense: "🧾",
  income: "💰",
  transfer: "🔁",
} as const;

export function RecurringPaymentRow({ payment, today, onPress }: RecurringPaymentRowProps) {
  const next = getNextOccurrence(payment, today);
  const cadence = formatRecurrence(payment);
  const subtitle = next
    ? `${cadence} · ${formatUpcomingOccurrence(next, today)}`
    : `${cadence} · Ended`;

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-5 py-3.5 active:bg-surface-container/50"
      onPress={onPress}
    >
      <View className="size-10 items-center justify-center rounded-full bg-surface">
        <Text className="text-lg">{TYPE_EMOJI[payment.type]}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-semibold text-sm text-ink" numberOfLines={1}>
          {payment.name}
        </Text>
        <Text className="font-body-normal text-xs text-ink/40" numberOfLines={1}>
          {subtitle}
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
