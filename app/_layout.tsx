import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/db/migrate";

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
  const drizzleDb = drizzle(db);
  await runMigrations(drizzleDb);
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={onDatabaseInit} useSuspense>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Suspense fallback={<LoadingFallback />}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen
                name="transaction/new"
                options={{ presentation: "modal", title: "Add Transaction" }}
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
          </Suspense>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}
