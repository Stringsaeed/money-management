import { router, useLocalSearchParams } from "expo-router";

import { TransactionScreen } from "@/features/ledger/transactions/transaction-screen";

export default function TransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionScreen id={id} onBack={() => router.back()} />;
}
