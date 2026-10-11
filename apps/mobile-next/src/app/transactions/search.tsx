import { router } from "expo-router";

import { LedgerSearchScreen } from "@/features/ledger";

export default function LedgerSearchRoute() {
  return (
    <LedgerSearchScreen
      onCancel={() => router.back()}
      onOpenTransaction={(transaction) => router.push(`/transactions/${transaction.id}`)}
    />
  );
}
