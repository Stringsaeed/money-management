import { View } from "react-native";
import { Text } from "@/components/ui/text";

import { TransactionRow } from "./transaction-row";
import { formatCents } from "@/utils/currency";
import { formatDayHeader } from "@/utils/date";
import type { DayGroup } from "@/types";

interface TransactionGroupProps {
  group: DayGroup;
  currency?: string;
  showAccount?: boolean;
}

export function TransactionGroup({ group, currency = "USD", showAccount }: TransactionGroupProps) {
  const net = group.totalIncome - group.totalExpense;

  return (
    <View className="mb-px">
      {/* Day header */}
      <View className="flex-row justify-between items-center px-5 py-2.5 bg-surface-container/50">
        <Text className="font-body-semibold text-[11px] text-ink/50 uppercase tracking-[0.5px]">
          {formatDayHeader(group.date)}
        </Text>
        {(group.totalIncome > 0 || group.totalExpense > 0) && (
          <Text
            className={`font-heading-normal text-[13px] ${net >= 0 ? "text-sage" : "text-terracotta"}`}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {net >= 0 ? "+" : ""}
            {formatCents(net, currency)}
          </Text>
        )}
      </View>

      {/* Rows */}
      <View>
        {group.transactions.map((t, i) => (
          <View key={t.id}>
            {i > 0 && <View className="h-px bg-ledger-outline ml-16" />}
            <TransactionRow transaction={t} showAccount={showAccount} />
          </View>
        ))}
      </View>
    </View>
  );
}
