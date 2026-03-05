import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";

import { EmptyState } from "@/components/common/empty-state";
import { useRecurringPayments } from "@/hooks/use-recurring-payments";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { formatCents } from "@/utils/currency";
import { Colors } from "@/constants/theme";
import type { RecurringPayment } from "@/types";

const INTERVAL_LABELS: Record<RecurringPayment["interval"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function RecurringListScreen() {
  const { data: recurring = [], isLoading } = useRecurringPayments();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: "white" }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Recurring Payments</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : recurring.length === 0 ? (
        <EmptyState
          icon="🔄"
          title="No recurring payments"
          message="Set up recurring payments for rent, subscriptions, or regular income."
          action={
            <Pressable
              onPress={() => router.push("/recurring/new")}
              style={{
                backgroundColor: "#0a7ea4",
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Add Recurring</Text>
            </Pressable>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {recurring.map((r) => {
            const account = accountMap.get(r.accountId);
            const category = r.categoryId ? categoryMap.get(r.categoryId) : undefined;
            const typeColor =
              r.type === "income"
                ? Colors.light.income
                : r.type === "expense"
                  ? Colors.light.expense
                  : Colors.light.transfer;

            return (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/recurring/${r.id}/edit`)}
                style={({ pressed }) => ({
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 16,
                  opacity: pressed ? 0.8 : 1,
                  borderLeftWidth: 4,
                  borderLeftColor: typeColor,
                })}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                    {r.name}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: typeColor }}>
                    {r.type === "income" ? "+" : r.type === "expense" ? "-" : ""}
                    {formatCents(r.amount, r.currency)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    {INTERVAL_LABELS[r.interval]}
                  </Text>
                  {account ? (
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>· {account.name}</Text>
                  ) : null}
                  {category ? (
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>· {category.name}</Text>
                  ) : null}
                  {!r.isActive ? (
                    <Text style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
                      (paused)
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/recurring/new")}
        style={{
          position: "absolute",
          bottom: 32,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#0a7ea4",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Text style={{ color: "white", fontSize: 28, lineHeight: 30 }}>+</Text>
      </Pressable>
    </View>
  );
}
