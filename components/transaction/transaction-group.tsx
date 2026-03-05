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
  const netClass = net >= 0 ? "text-green-600" : "text-red-600";

  return (
    <View className="mb-1">
      {/* Day header */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-gray-100">
        <Text className="text-[13px] font-semibold text-gray-700">
          {formatDayHeader(group.date)}
        </Text>
        {(group.totalIncome > 0 || group.totalExpense > 0) && (
          <Text
            className={`text-[13px] font-semibold ${netClass}`}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {net >= 0 ? "+" : ""}
            {formatCents(net, currency)}
          </Text>
        )}
      </View>

      {/* Rows */}
      <View className="bg-white">
        {group.transactions.map((t, i) => (
          <View key={t.id}>
            {i > 0 && <View className="h-px bg-gray-100 ml-17" />}
            <TransactionRow transaction={t} showAccount={showAccount} />
          </View>
        ))}
      </View>
    </View>
  );
}
