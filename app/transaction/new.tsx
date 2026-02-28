import { router } from "expo-router";

import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import { useCreateTransaction } from "@/hooks/use-transactions";

export default function NewTransactionScreen() {
  const createTransaction = useCreateTransaction();

  async function handleSubmit(data: TransactionFormData) {
    await createTransaction.mutateAsync({
      ...data,
      recurringPaymentId: null,
    });
    router.back();
  }

  return <TransactionForm onSubmit={handleSubmit} submitLabel="Add Transaction" />;
}
