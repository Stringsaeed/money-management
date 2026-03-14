import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { drizzle } from "drizzle-orm/expo-sqlite";
import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { HeroUINativeProvider } from "heroui-native/provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";

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
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
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
            <HeroUINativeProvider>
              <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="splash" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="transaction/new"
                    options={{
                      presentation: "card",
                      title: "Add Transaction",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="transaction/[id]"
                    options={{ presentation: "modal", title: "Edit Transaction" }}
                  />
                  <Stack.Screen
                    name="account/new"
                    options={{ presentation: "modal", title: "New Account" }}
                  />
                  <Stack.Screen name="account/[id]" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="account/[id]/edit"
                    options={{ presentation: "modal", title: "Edit Account" }}
                  />
                  <Stack.Screen
                    name="category/new"
                    options={{ presentation: "modal", title: "New Category" }}
                  />
                  <Stack.Screen
                    name="category/[id]/edit"
                    options={{ presentation: "modal", title: "Edit Category" }}
                  />
                  <Stack.Screen name="recurring/index" options={{ title: "Recurring Payments" }} />
                  <Stack.Screen
                    name="recurring/new"
                    options={{ presentation: "modal", title: "New Recurring" }}
                  />
                  <Stack.Screen
                    name="recurring/[id]/edit"
                    options={{ presentation: "modal", title: "Edit Recurring" }}
                  />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </HeroUINativeProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
