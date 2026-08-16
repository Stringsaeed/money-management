import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import type { NativeStackHeaderItem } from "expo-router/build/react-navigation/native-stack";

import { toRecurringPayment } from "@/components/transaction/recurrence/to-recurring-payment";
import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import type { TransactionFormHandle } from "@/components/transaction/types";
import { useCategories } from "@/hooks/use-categories";
import { useCreateRecurringPayment } from "@/hooks/use-recurring-payments";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { toDateString } from "@/utils/date";

const NEW_ID = "new";

export default function TransactionScreen() {
  const router = useRouter();
  const { id, recurring } = useLocalSearchParams<{ id: string; recurring?: string }>();
  const isNew = id === NEW_ID;

  const formRef = useRef<TransactionFormHandle | null>(null);
  const [isRecurring, setIsRecurring] = useState(recurring === "true");

  const { data: categories = [] } = useCategories();
  const { data: transaction, isLoading } = useTransaction(isNew ? undefined : id);
  const createTransaction = useCreateTransaction();
  const createRecurring = useCreateRecurringPayment();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  if (!isNew && isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isNew && !transaction) return null;

  async function handleSubmit(data: TransactionFormData) {
    if (isNew && isRecurring) {
      await createRecurring.mutateAsync(toRecurringPayment(data, categories));
    } else if (isNew) {
      await createTransaction.mutateAsync({
        ...data,
        date: toDateString(data.date),
        isRecurring: false,
        recurringPaymentId: null,
      });
    } else {
      await updateTransaction.mutateAsync({
        id,
        data: { ...data, date: toDateString(data.date) },
      });
    }

    if (router.canGoBack()) {
      router.back();
    } else if (router.canDismiss()) {
      router.dismiss();
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  }

  const headerRightItems: NativeStackHeaderItem[] = isNew
    ? [
        {
          label: isRecurring ? "Make one-time" : "Make recurring",
          type: "button",
          onPress: () => setIsRecurring((current) => !current),
          icon: { type: "sfSymbol", name: isRecurring ? "repeat.circle" : "1.circle" },
          sharesBackground: false,
        },
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
          transaction
            ? {
                type: transaction.type,
                amount: transaction.amount,
                accountId: transaction.accountId,
                toAccountId: transaction.toAccountId,
                categoryId: transaction.categoryId,
                isRecurring: transaction.isRecurring,
                description: transaction.description,
                date: new Date(transaction.date),
                currency: transaction.currency,
                originalAmount: transaction.originalAmount,
                originalCurrency: transaction.originalCurrency,
                exchangeRate: transaction.exchangeRate,
              }
            : undefined
        }
        isRecurring={isRecurring}
        onSubmit={handleSubmit}
        formRef={formRef}
      />
    </>
  );
}
