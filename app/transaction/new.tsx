import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { toDateString } from "@/utils/date";
import { useRouter } from "expo-router";

export default function NewTransactionScreen() {
  const router = useRouter();
  const createTransaction = useCreateTransaction();

  async function handleSubmit(data: TransactionFormData) {
    await createTransaction.mutateAsync({
      ...data,
      date: toDateString(data.date),
      recurringPaymentId: null,
    });

    if (router.canGoBack()) {
      router.back();
    } else if (router.canDismiss()) {
      router.dismiss();
    }
  }

  return <TransactionForm onSubmit={handleSubmit} submitLabel="Add Transaction" />;
}
