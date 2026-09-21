import { router } from "expo-router";

import { RecurringScreen } from "@/features/ledger/transactions/recurring/recurring-screen";

export default function RecurringRoute() {
  return <RecurringScreen onOpenRule={(id) => router.push(`/recurring/${id}`)} />;
}
