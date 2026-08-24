import { Stack } from "expo-router";

import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function InboxStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen name="index" options={{ title: "Inbox", headerTransparent: true }} />
    </Stack>
  );
}
