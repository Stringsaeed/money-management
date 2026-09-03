import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "Nunito_400Regular" },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
      <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
    </Stack>
  );
}
