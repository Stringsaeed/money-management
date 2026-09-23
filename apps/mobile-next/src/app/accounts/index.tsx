import { router } from "expo-router";

import { AccountsScreen } from "@/features/ledger/accounts/accounts-screen";

export default function AccountsRoute() {
  return <AccountsScreen onOpenAccount={(id) => router.push(`/accounts/${id}`)} />;
}
