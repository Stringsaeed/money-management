import { Pressable, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { formatCents } from "@/utils/currency";
import { formatUpcomingOccurrence } from "@/utils/recurring";
import type { TransactionWithDetails } from "@/types";

interface UpcomingRecurringRowProps {
  transaction: TransactionWithDetails;
  today: string;
  onPress: () => void;
}

const TYPE_EMOJI = {
  expense: "🧾",
  income: "💰",
  transfer: "🔁",
} as const;

export function UpcomingRecurringRow({ transaction, today, onPress }: UpcomingRecurringRowProps) {
  const occurrenceLabel = formatUpcomingOccurrence(transaction.date, today);
  const formattedAmount = formatCents(transaction.amount, transaction.currency);
  const amountLabel =
    transaction.type === "income"
      ? `plus ${formattedAmount}`
      : transaction.type === "expense"
        ? `minus ${formattedAmount}`
        : formattedAmount;

  return (
    <Pressable
      accessibilityLabel={`${transaction.description || transaction.category?.name || "Transaction"}, ${occurrenceLabel}, ${amountLabel}`}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-dim"
      onPress={onPress}
    >
      <View className="size-10 items-center justify-center rounded-full bg-surface">
        <Text className="text-lg">{TYPE_EMOJI[transaction.type]}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-semibold text-sm text-ink" numberOfLines={1}>
          {transaction.description || transaction.category?.name || "Transaction"}
        </Text>
        <Text className="font-body-normal text-xs text-ink/40">
          {transaction.category?.name ??
            (transaction.type === "transfer" ? "Transfer" : "Recurring")}{" "}
          · {occurrenceLabel}
        </Text>
      </View>
      <MoneyText
        cents={transaction.amount}
        currency={transaction.currency}
        sign={transaction.type === "income" ? "+" : transaction.type === "expense" ? "−" : ""}
        className={cn(
          "font-heading-medium text-base",
          transaction.type === "income" ? "text-sage" : "text-ink",
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      />
    </Pressable>
  );
}
