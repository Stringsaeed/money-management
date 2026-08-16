import { router } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { TransactionRow } from "@/components/transaction/transaction-row";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { EmptyState } from "@/components/common/empty-state";
import { WateringCanGraphic } from "@/components/graphics/watering-can";
import { useTransactions } from "@/hooks/use-transactions";

const newRecurringTransactionRoute = {
  pathname: "/transaction/[id]" as const,
  params: { id: "new", recurring: "true" },
};

export default function RecurringListScreen() {
  const { data: recurringTransactions = [], isLoading } = useTransactions({ isRecurring: true });

  return (
    <View className="flex-1 bg-background pt-safe-offset-20">
      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : recurringTransactions.length === 0 ? (
        <EmptyState
          illustration={<WateringCanGraphic />}
          title="No recurring payments"
          message="Set up recurring payments for rent, subscriptions, or regular income."
          action={
            <Button onPress={() => router.push(newRecurringTransactionRoute)}>
              <Text>Add Recurring</Text>
            </Button>
          }
        />
      ) : (
        <ScrollView>
          <View className="gap-1 py-3">
            {recurringTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} showAccount />
            ))}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <Button onPress={() => router.push(newRecurringTransactionRoute)} size="fab">
        <Text className="text-3xl">+</Text>
      </Button>
    </View>
  );
}
