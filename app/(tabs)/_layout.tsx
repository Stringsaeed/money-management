import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#141312" : "white",
          },
          sheetResizeAnimationEnabled: false,
        }}
      />
    </Stack>
  );
}
