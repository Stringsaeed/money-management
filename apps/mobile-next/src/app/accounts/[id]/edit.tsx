import { router, useLocalSearchParams } from "expo-router";

import { AccountEditorScreen } from "@/features/ledger/accounts/account-editor-screen";

export default function EditAccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AccountEditorScreen id={id} onDone={() => router.back()} />;
}
