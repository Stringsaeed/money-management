import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { CategoryBadge } from "@/components/category/category-badge";
import { Colors } from "@/constants/theme";
import { formatCents } from "@/utils/currency";
import type { TransactionWithDetails } from "@/types";

interface TransactionRowProps {
  transaction: TransactionWithDetails;
  showAccount?: boolean;
  dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
}

export function TransactionRow({ transaction: t, showAccount = false }: TransactionRowProps) {
  const isIncome = t.type === "income";
  const isTransfer = t.type === "transfer";

  const amountColor = isTransfer
    ? Colors.light.transfer
    : isIncome
      ? Colors.light.income
      : Colors.light.expense;

  const amountPrefix = isIncome ? "+" : isTransfer ? "" : "-";

  return (
    <Pressable
      onPress={() => router.push(`/transaction/${t.id}`)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: pressed ? "#F9FAFB" : "white",
        gap: 12,
      })}
    >
      {/* Category color dot */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: t.category?.color ? `${t.category.color}20` : `${t.account.color}20`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: t.category?.color ?? t.account.color,
          }}
        />
      </View>

      {/* Middle: description + category */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: "#111827" }} numberOfLines={1}>
          {t.description || t.category?.name || (isTransfer ? "Transfer" : "Transaction")}
        </Text>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {t.category ? (
            <CategoryBadge name={t.category.name} color={t.category.color} size="sm" />
          ) : null}
          {isTransfer && t.toAccount ? (
            <Text style={{ fontSize: 11, color: "#6B7280" }}>→ {t.toAccount.name}</Text>
          ) : null}
          {showAccount ? (
            <Text style={{ fontSize: 11, color: "#6B7280" }}>{t.account.name}</Text>
          ) : null}
        </View>
      </View>

      {/* Amount */}
      <Text style={{ fontSize: 16, fontWeight: "600", color: amountColor }}>
        {amountPrefix}
        {formatCents(t.amount, t.currency)}
      </Text>
    </Pressable>
  );
}
