import { Pressable, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import type { RecurringRule } from "@/modules/recurring-rules";
import { formatCents } from "@/utils/currency";
import { formatUpcomingOccurrence } from "@/utils/recurring";

import { styles, lightStyles } from "./styles";

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
      onPress={onPress}
      style={({ pressed }) => [styles.upcomingRow, pressed && lightStyles.upcomingRowPressed]}
    >
      <View style={styles.upcomingRowIcon}>
        <Text style={styles.upcomingRowEmoji}>{TYPE_EMOJI[rule.type]}</Text>
      </View>
      <View style={styles.upcomingRowContent}>
        <Text numberOfLines={1} style={styles.upcomingRowTitle}>
          {rule.name}
        </Text>
        <Text style={styles.upcomingRowSubtitle}>
          {rule.type === "transfer" ? "Transfer" : "Recurring"} · {occurrenceLabel}
        </Text>
      </View>
      <MoneyText
        cents={rule.amountMinor ?? 0}
        currency={rule.currency}
        sign={rule.type === "income" ? "+" : rule.type === "expense" ? "−" : ""}
        style={rule.type === "income" ? styles.upcomingAmountSage : styles.upcomingAmountInk}
      />
    </Pressable>
  );
}
