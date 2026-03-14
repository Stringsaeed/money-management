import { Stack } from "expo-router";

export default function TabLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{ title: "Settings", headerBackButtonDisplayMode: "minimal" }}
      />
      <Stack.Screen
        name="filters"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
          title: "Filters",
          contentStyle: { backgroundColor: "white" },
          sheetResizeAnimationEnabled: false,
        }}
      />
    </Stack>
  );
}
