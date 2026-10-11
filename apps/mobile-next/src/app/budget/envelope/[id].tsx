import { useLocalSearchParams } from "expo-router";

import { EnvelopeDetailScreen } from "@/features/budget/envelope/envelope-detail-screen";

export default function BudgetEnvelopeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EnvelopeDetailScreen id={id} />;
}
