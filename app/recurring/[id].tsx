import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import type { NativeStackHeaderItem } from "expo-router/build/react-navigation/native-stack";

import { toRecurringPayment } from "@/components/transaction/recurrence/to-recurring-payment";
import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import type { TransactionFormHandle } from "@/components/transaction/types";
import { useCategories } from "@/hooks/use-categories";
import {
  useCreateRecurringPayment,
  useDeleteRecurringPayment,
  useRecurringPayment,
  useUpdateRecurringPayment,
} from "@/hooks/use-recurring-payments";
import { parseDate } from "@/utils/date";

const NEW_ID = "new";

export default function RecurringScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === NEW_ID;

  const formRef = useRef<TransactionFormHandle | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: rule, isLoading } = useRecurringPayment(isNew ? "" : id);
  const createRecurring = useCreateRecurringPayment();
  const updateRecurring = useUpdateRecurringPayment();
  const deleteRecurring = useDeleteRecurringPayment();

  if (!isNew && isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isNew && !rule) return null;

  async function handleSubmit(data: TransactionFormData) {
    const rule = toRecurringPayment(data, categories);

    if (isNew) {
      await createRecurring.mutateAsync(rule);
    } else {
      // Preserve generation progress and active state on edit.
      const { lastGeneratedDate: _lastGeneratedDate, isActive: _isActive, ...updatable } = rule;
      await updateRecurring.mutateAsync({ id, data: updatable });
    }

    if (router.canGoBack()) router.back();
    else if (router.canDismiss()) router.dismiss();
  }

  function handleDelete() {
    Alert.alert(
      "Delete Recurring Payment",
      "Stop this recurring payment? Already-generated transactions are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRecurring.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  }

  const headerRightItems: NativeStackHeaderItem[] = isNew
    ? [
        {
          label: "save",
          type: "button",
          onPress: () => formRef.current?.submit(),
          icon: { type: "sfSymbol", name: "checkmark" },
        },
      ]
    : [
        {
          label: "delete",
          type: "button",
          onPress: handleDelete,
          icon: { type: "sfSymbol", name: "trash" },
          tintColor: "red",
          sharesBackground: false,
        },
        {
          label: "save",
          type: "button",
          onPress: () => formRef.current?.submit(),
          icon: { type: "sfSymbol", name: "checkmark" },
          sharesBackground: false,
        },
      ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerBackButtonDisplayMode: "minimal",
          unstable_headerRightItems: () => headerRightItems,
        }}
      />
      <TransactionForm
        initialData={
          rule
            ? {
                type: rule.type,
                amount: rule.amount,
                accountId: rule.accountId,
                toAccountId: rule.toAccountId,
                categoryId: rule.categoryId,
                isRecurring: true,
                description: rule.description,
                date: parseDate(rule.startDate),
                currency: rule.currency,
                originalAmount: null,
                originalCurrency: null,
                exchangeRate: null,
                recurrence: {
                  frequency: rule.frequency,
                  intervalCount: rule.intervalCount,
                  endDate: rule.endDate ? parseDate(rule.endDate) : null,
                  endCount: rule.endCount,
                },
              }
            : undefined
        }
        isRecurring
        onSubmit={handleSubmit}
        formRef={formRef}
      />
    </>
  );
}
