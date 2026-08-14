import { View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { formatDayHeader } from "@/utils/date";

import type { JournalDayHeaderProps } from "./types";

export function JournalDayHeader({ item }: JournalDayHeaderProps) {
  const net = item.totalIncome - item.totalExpense;

  return (
    <View className="flex-row items-center justify-between bg-surface-container/50 px-5 py-2.5">
      <Text className="font-body-semibold text-[11px] uppercase tracking-tight text-ink/50">
        {formatDayHeader(item.date)}
      </Text>
      {(item.totalIncome > 0 || item.totalExpense > 0) && (
        <MoneyText
          cents={net}
          currency={item.currency}
          sign={net >= 0 ? "+" : ""}
          className={cn(
            "font-heading-normal text-[13px]",
            net >= 0 ? "text-sage" : "text-terracotta",
          )}
          style={{ fontVariant: ["tabular-nums"] }}
        />
      )}
    </View>
  );
}
