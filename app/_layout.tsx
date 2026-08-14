import { drizzle } from "drizzle-orm/expo-sqlite";
import { useFonts } from "expo-font";
import {
  Nunito_200ExtraLight,
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { BottomSheetProvider } from "@swmansion/react-native-bottom-sheet";
import { PostHogProvider } from "posthog-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/db/migrate";
import { markDatabaseReset, resetDatabaseIfNeeded } from "@/db/reset";
import { seedDatabase } from "@/db/seed";
import { PortalHost } from "@rn-primitives/portal";
import { PressablesConfig } from "pressto";
import * as Haptics from "expo-haptics";

import { AppUpdateProvider } from "@/components/updates/app-update-provider";
import { MandatoryUpdateGate } from "@/components/updates/mandatory-update-gate";

// Keep the native splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
    },
  },
});

const DB_NAME = "money.db";

async function onDatabaseInit(db: SQLiteDatabase) {
  try {
    console.log("Initializing database...");
    const drizzleDb = drizzle(db);

    // Order matters: the wipe takes app_settings with it, so the reset version
    // can only be recorded once migrations have rebuilt the schema.
    const didReset = await resetDatabaseIfNeeded(db);
    if (didReset) console.log("Reset database to a clean baseline.");

    console.log("Running migrations...");
    await runMigrations(drizzleDb);

    if (didReset) await markDatabaseReset(drizzleDb);

    console.log("Seeding database...");
    await seedDatabase(drizzleDb);
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

function LoadingFallback() {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Nunito_200ExtraLight,
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PostHogProvider
        debug={__DEV__}
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY}
        options={{
          host: "https://us.i.posthog.com",
        }}
      >
        <SQLiteProvider databaseName={DB_NAME} onInit={onDatabaseInit} useSuspense>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <PressablesConfig
                globalHandlers={{
                  onPress: () => {
                    Haptics.selectionAsync();
                  },
                }}
              >
                <BottomSheetProvider>
                  <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <AppUpdateProvider>
                      <Stack
                        screenOptions={{
                          headerTransparent: true,
                          headerShadowVisible: false,
                          headerBlurEffect: "none",
                          headerLargeTitleStyle: { fontFamily: "Nunito_400Regular" },
                          headerTitleStyle: { fontFamily: "Nunito_400Regular" },
                          headerBackButtonDisplayMode: "minimal",
                        }}
                      >
                        <Stack.Screen name="splash" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="categories" options={{ title: "Categories" }} />
                        <Stack.Screen name="accounts" options={{ title: "Accounts" }} />
                        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                        <Stack.Screen name="transaction/[id]" options={{ presentation: "card" }} />
                        <Stack.Screen name="account/[id]" options={{ headerShown: false }} />
                        <Stack.Screen
                          name="account/[id]/edit"
                          options={{
                            presentation: "modal",
                            title: "Edit Account",
                            headerTransparent: false,
                          }}
                        />
                        <Stack.Screen
                          name="category/new"
                          options={{
                            presentation: "modal",
                            title: "New Category",
                            headerTransparent: false,
                          }}
                        />
                        <Stack.Screen
                          name="recurring/index"
                          options={{ title: "Recurring Payments" }}
                        />
                        <Stack.Screen
                          name="recurring/new"
                          options={{
                            presentation: "modal",
                            title: "New Recurring",
                            headerTransparent: false,
                          }}
                        />
                        <Stack.Screen
                          name="recurring/[id]/edit"
                          options={{
                            presentation: "modal",
                            title: "Edit Recurring",
                            headerTransparent: false,
                          }}
                        />
                      </Stack>
                      <StatusBar style="auto" />
                      <MandatoryUpdateGate />
                      <PortalHost />
                    </AppUpdateProvider>
                  </ThemeProvider>
                </BottomSheetProvider>
              </PressablesConfig>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </SQLiteProvider>
      </PostHogProvider>
    </Suspense>
  );
}
