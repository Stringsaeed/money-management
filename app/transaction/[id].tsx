import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, View } from "react-native";

import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import {
  useDeleteTransaction,
  useTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { toDateString } from "@/utils/date";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!transaction) return null;

  async function handleSubmit(data: TransactionFormData) {
    await updateTransaction.mutateAsync({ id, data: { ...data, date: toDateString(data.date) } });
    router.back();
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

  return (
    <TransactionForm
      initialData={{
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
      }}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      submitLabel="Save Changes"
    />
  );
}
