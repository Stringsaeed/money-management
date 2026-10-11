import { router } from "expo-router";

import { Header } from "@/ui/trove";

/** Bills & big payments' compact pushed-screen header. */
export function BillsHeader() {
  return <Header variant="compact" title="Bills & big payments" onBack={() => router.back()} />;
}
