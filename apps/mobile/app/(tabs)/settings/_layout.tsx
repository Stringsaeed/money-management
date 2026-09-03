import { Stack } from "expo-router";

import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen name="index" options={{ title: "Settings", headerTransparent: true }} />
      <Stack.Screen
        name="household"
        options={{ title: "Profile & household", headerTransparent: true }}
      />
    </Stack>
  );
}
