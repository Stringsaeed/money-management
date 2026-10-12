import { router } from "expo-router";

import { SettingsScreen } from "@/features/settings";

export default function SettingsRoute() {
  return <SettingsScreen onBack={() => router.back()} />;
}
