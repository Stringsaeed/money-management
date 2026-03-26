import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { NativeStackHeaderItem } from "@react-navigation/native-stack";

import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import type { TransactionFormHandle } from "@/components/transaction/types";
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === NEW_ID;

  const formRef = useRef<TransactionFormHandle | null>(null);

  const { data: transaction, isLoading } = useTransaction(isNew ? undefined : id);
  const createTransaction = useCreateTransaction();
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
    if (isNew) {
      await createTransaction.mutateAsync({
        ...data,
        date: toDateString(data.date),
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
          title: isNew ? "New Entry" : "Edit Entry",
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
                description: transaction.description,
                date: new Date(transaction.date),
                currency: transaction.currency,
                originalAmount: transaction.originalAmount,
                originalCurrency: transaction.originalCurrency,
                exchangeRate: transaction.exchangeRate,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        formRef={formRef}
      />
    </>
  );
}
