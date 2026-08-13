import { drizzle } from "drizzle-orm/expo-sqlite";
import { useFonts } from "expo-font";
import {
  Newsreader_200ExtraLight,
  Newsreader_300Light,
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
  Newsreader_800ExtraBold,
} from "@expo-google-fonts/newsreader";
import {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
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

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/db/migrate";
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
    console.log("Running migrations...");
    await runMigrations(drizzleDb);
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
    Newsreader_200ExtraLight,
    Newsreader_300Light,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Newsreader_800ExtraBold,

    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
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
                        headerLargeTitleStyle: { fontFamily: "Newsreader_400Regular" },
                        headerTitleStyle: { fontFamily: "Newsreader_400Regular" },
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
    </Suspense>
  );
}
