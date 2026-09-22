import { Stack } from "expo-router/stack";
import { colors, typography } from "@/ui/design-tokens";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerBlurEffect: "none",
        headerStyle: { backgroundColor: "transparent" },
        headerTitleStyle: {
          fontFamily: typography.fontBodyBold,
          color: colors.foreground,
          fontSize: 20,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
