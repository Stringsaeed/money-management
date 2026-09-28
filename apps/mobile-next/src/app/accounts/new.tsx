import { router } from "expo-router";

import { AccountEditorScreen } from "@/features/ledger/accounts/account-editor-screen";

export default function NewAccountRoute() {
  return <AccountEditorScreen onDone={() => router.back()} />;
}
