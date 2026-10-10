import { Stack } from "expo-router/stack";
import { colors, fonts } from "@/ui/trove";

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
          fontFamily: fonts.bold,
          color: colors.text.primary,
          fontSize: 20,
        },
        contentStyle: { backgroundColor: colors.bg.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
