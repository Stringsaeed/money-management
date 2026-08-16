import { router } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { EmptyState } from "@/components/common/empty-state";
import { WateringCanGraphic } from "@/components/graphics/watering-can";
import { RecurringPaymentRow } from "@/components/recurring/recurring-payment-row";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useRecurringPayments } from "@/hooks/use-recurring-payments";
import { today } from "@/utils/date";

const newRecurringRoute = {
  pathname: "/recurring/[id]" as const,
  params: { id: "new" },
};

export default function RecurringListScreen() {
  const { data: recurringPayments = [], isLoading } = useRecurringPayments();
  const todayString = today();

  return (
    <View className="flex-1 bg-background pt-safe-offset-20">
      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : recurringPayments.length === 0 ? (
        <EmptyState
          illustration={<WateringCanGraphic />}
          title="No recurring payments"
          message="Set up recurring payments for rent, subscriptions, or regular income."
          action={
            <Button onPress={() => router.push(newRecurringRoute)}>
              <Text>Add Recurring</Text>
            </Button>
          }
        />
      ) : (
        <ScrollView>
          <View className="gap-1 py-3">
            {recurringPayments.map((payment) => (
              <RecurringPaymentRow
                key={payment.id}
                payment={payment}
                today={todayString}
                onPress={() =>
                  router.push({ pathname: "/recurring/[id]", params: { id: payment.id } })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <Button onPress={() => router.push(newRecurringRoute)} size="fab">
        <Text className="text-3xl">+</Text>
      </Button>
    </View>
  );
}
