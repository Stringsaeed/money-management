import { Text, View } from "react-native";

import { TransactionRow } from "./transaction-row";
import { Colors } from "@/constants/theme";
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
    <View style={{ marginBottom: 4 }}>
      {/* Day header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: "#F3F4F6",
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>
          {formatDayHeader(group.date)}
        </Text>
        {(group.totalIncome > 0 || group.totalExpense > 0) && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: net >= 0 ? Colors.light.income : Colors.light.expense,
            }}
          >
            {net >= 0 ? "+" : ""}
            {formatCents(net, currency)}
          </Text>
        )}
      </View>

      {/* Transaction rows */}
      <View style={{ backgroundColor: "white" }}>
        {group.transactions.map((t, i) => (
          <View key={t.id}>
            {i > 0 && <View style={{ height: 1, backgroundColor: "#F3F4F6", marginLeft: 68 }} />}
            <TransactionRow transaction={t} showAccount={showAccount} />
          </View>
        ))}
      </View>
    </View>
  );
}
