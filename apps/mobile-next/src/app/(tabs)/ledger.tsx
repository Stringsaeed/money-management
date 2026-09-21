import { router } from "expo-router";

import { LedgerScreen } from "@/features/ledger/ledger-screen";

export default function LedgerRoute() {
  return (
    <LedgerScreen
      onAddTransaction={() => router.push("/transactions/new")}
      onOpenTransaction={(transaction) => router.push(`/transactions/${transaction.id}`)}
      onOpenAccounts={() => router.push("/accounts")}
      onOpenCategories={() => router.push("/categories")}
      onOpenRecurring={() => router.push("/recurring")}
    />
  );
}
