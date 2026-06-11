import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, useColorScheme, View } from "react-native";
import { Text } from "@/components/ui/text";

import { EmptyState } from "@/components/common/empty-state";
import { WateringCanGraphic } from "@/components/graphics/watering-can";
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
  const colorScheme = useColorScheme();

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <View className="flex-1 bg-background pt-safe-offset-20">
      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : recurring.length === 0 ? (
        <EmptyState
          illustration={<WateringCanGraphic />}
          title="No recurring payments"
          message="Set up recurring payments for rent, subscriptions, or regular income."
          action={
            <Pressable
              onPress={() => router.push("/recurring/new")}
              className="bg-brand rounded-[10px] px-5 py-3"
            >
              <Text className="text-brand-foreground font-semibold">Add Recurring</Text>
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
                ? colors.income
                : r.type === "expense"
                  ? colors.expense
                  : colors.transfer;

            return (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/recurring/${r.id}/edit`)}
                className="bg-card rounded-xl p-4 active:opacity-80"
                style={{ borderLeftWidth: 4, borderLeftColor: typeColor }}
              >
                <View className="flex-row justify-between">
                  <Text className="text-base font-semibold text-foreground">{r.name}</Text>
                  <Text
                    className="text-base font-bold"
                    style={{ color: typeColor, fontVariant: ["tabular-nums"] }}
                  >
                    {r.type === "income" ? "+" : r.type === "expense" ? "-" : ""}
                    {formatCents(r.amount, r.currency)}
                  </Text>
                </View>
                <View className="flex-row gap-2 mt-1.5 items-center">
                  <Text className="text-xs text-muted-foreground">
                    {INTERVAL_LABELS[r.interval]}
                  </Text>
                  {account ? (
                    <Text className="text-xs text-muted-foreground">· {account.name}</Text>
                  ) : null}
                  {category ? (
                    <Text className="text-xs text-muted-foreground">· {category.name}</Text>
                  ) : null}
                  {!r.isActive ? (
                    <Text className="text-xs text-muted-foreground/60 italic">(paused)</Text>
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
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 8px ${colorScheme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)"}`,
        }}
        className="bg-brand"
      >
        <Text style={{ color: "white", fontSize: 28, lineHeight: 30 }}>+</Text>
      </Pressable>
    </View>
  );
}
