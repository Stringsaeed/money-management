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
        // Let native header colors follow the window's system appearance.
        unstable_nativeProps: { headerConfig: { experimental_userInterfaceStyle: "unspecified" } },
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
