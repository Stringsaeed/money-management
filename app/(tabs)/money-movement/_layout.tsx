import { Stack } from "expo-router";

import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function MoneyMovementStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen name="index" options={{ title: "Money Movement", headerTransparent: true }} />
    </Stack>
  );
}
