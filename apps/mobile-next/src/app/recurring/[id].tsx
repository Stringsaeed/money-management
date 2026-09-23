import { router, useLocalSearchParams } from "expo-router";

import { RecurringRuleScreen } from "@/features/ledger/transactions/recurring/recurring-rule-screen";

export default function RecurringRuleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecurringRuleScreen id={id} onBack={() => router.back()} />;
}
