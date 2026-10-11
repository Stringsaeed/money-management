import { router } from "expo-router";

import { HouseholdScreen } from "@/features/household/household-screen";

export default function HouseholdRoute() {
  return <HouseholdScreen onBack={() => router.back()} />;
}
