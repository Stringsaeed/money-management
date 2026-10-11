import { router } from "expo-router";

import { Header } from "@/ui/trove";

/** The Due screen's compact pushed-screen header. */
export function DueHeader() {
  return <Header variant="compact" title="Due" onBack={() => router.back()} />;
}
