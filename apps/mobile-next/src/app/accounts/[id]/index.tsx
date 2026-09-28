import { router, useLocalSearchParams } from "expo-router";

import { AccountScreen } from "@/features/ledger/accounts/account-screen";

export default function AccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AccountScreen
      id={id}
      onBack={() => router.back()}
      onEdit={() => router.push({ pathname: "/accounts/[id]/edit", params: { id } })}
      onOpenTransaction={(transactionId) => router.push(`/transactions/${transactionId}`)}
    />
  );
}
