import { Stack } from "expo-router";

import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function EnvelopesStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen name="index" options={{ title: "Envelopes", headerTransparent: true }} />
      <Stack.Screen name="setup" options={{ title: "Setup Envelopes", headerTransparent: true }} />
      <Stack.Screen
        name="workspace"
        options={{ title: "Currency workspace", headerTransparent: true }}
      />
    </Stack>
  );
}
