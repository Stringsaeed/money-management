import { Stack } from "expo-router/stack";
import { colors } from "@/ui/trove";

// The Trove `Header` lives inside the screen, so the native header stays hidden.
export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.canvas } }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
