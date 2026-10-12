import { router } from "expo-router";

import { ProfileScreen } from "@/features/auth/profile-screen";

export default function SettingsRoute() {
  return <ProfileScreen onBack={() => router.back()} />;
}
