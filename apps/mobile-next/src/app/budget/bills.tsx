import { useLocalSearchParams } from "expo-router";

import { BillsScreen } from "@/features/budget/bills/bills-screen";

export default function BudgetBillsRoute() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <BillsScreen initialTab={tab === "saving" ? "saving" : "month"} />;
}
