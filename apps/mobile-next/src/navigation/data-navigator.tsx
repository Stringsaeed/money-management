import { Platform } from "react-native";
import { Stack } from "expo-router";
import type { QueryClient } from "@tanstack/react-query";
import { LedgerDataProvider } from "@/data/ledger-queries";
import { colors, fonts, useNativeHeaderStyle } from "@/ui/trove";
import { useBudgetingEnabled } from "@/features/feature-flags";
import { useReminderTapRouting } from "@/features/budget/reminders/use-reminder-tap-routing";
import { useLedgerScope } from "./ledger-scope-context";

interface DataNavigatorProps {
  readonly queryClient: QueryClient;
  readonly identityKey: string;
}

/** Editors open as full-height modals from anywhere in the app and draw their own header. */
const editorOptions = { presentation: "modal", headerShown: false } as const;

/** Pushed screens draw the Trove compact Header (back, title, actions) themselves. */
const pushedOptions = { headerShown: false } as const;

/**
 * Settings uses the native stack header: an iOS large title over the scroll view, which insets
 * its own content. Android keeps an opaque bar, so content starts below it. Colors come from
 * `useNativeHeaderStyle`, because native header props reject dynamic colors.
 */
const settingsOptions = {
  headerShown: true,
  title: "Settings",
  headerLargeTitleEnabled: true,
  headerLargeTitleShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
  headerTransparent: Platform.OS === "ios",
} as const;

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg.canvas },
  headerTintColor: colors.text.primary,
  headerTitleStyle: { fontFamily: fonts.bold, color: colors.text.primary },
  contentStyle: { backgroundColor: colors.bg.canvas },
  headerShadowVisible: false,
};

export const DataNavigator = ({ queryClient, identityKey }: DataNavigatorProps) => {
  const { scope } = useLedgerScope();
  const budgeting = useBudgetingEnabled();
  const headerStyle = useNativeHeaderStyle();
  useReminderTapRouting(identityKey);
  const scopeKey = scope.kind === "personal" ? "personal" : scope.householdId;
  return (
    <LedgerDataProvider
      key={`${identityKey}:${scopeKey}`}
      queryClient={queryClient}
      identityKey={identityKey}
      scope={scope}
    >
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="accounts/index" options={pushedOptions} />
        <Stack.Screen name="accounts/[id]/index" options={pushedOptions} />
        <Stack.Screen name="accounts/new" options={{ title: "New account", ...editorOptions }} />
        <Stack.Screen
          name="accounts/[id]/edit"
          options={{ title: "Edit account", ...editorOptions }}
        />
        <Stack.Screen name="categories/index" options={pushedOptions} />
        <Stack.Screen name="categories/new" options={{ title: "New category", ...editorOptions }} />
        <Stack.Screen
          name="categories/[id]"
          options={{ title: "Edit category", ...editorOptions }}
        />
        <Stack.Screen
          name="transactions/search"
          options={{ ...pushedOptions, animation: "fade" }}
        />
        <Stack.Screen
          name="transactions/[id]"
          options={{ title: "Transaction", ...editorOptions }}
        />
        <Stack.Screen name="recurring/index" options={pushedOptions} />
        <Stack.Screen name="recurring/[id]" options={{ ...pushedOptions, presentation: "modal" }} />
        <Stack.Screen name="household" options={pushedOptions} />
        <Stack.Screen name="settings" options={{ ...settingsOptions, ...headerStyle }} />
        <Stack.Protected guard={budgeting}>
          <Stack.Screen name="budget/setup/payday" options={pushedOptions} />
          <Stack.Screen name="budget/setup/items" options={pushedOptions} />
          <Stack.Screen name="budget/setup/amounts" options={pushedOptions} />
          <Stack.Screen name="budget/setup/review" options={pushedOptions} />
          <Stack.Screen name="budget/envelope/[id]" options={pushedOptions} />
          <Stack.Screen name="budget/due" options={pushedOptions} />
          <Stack.Screen name="budget/bills" options={pushedOptions} />
          <Stack.Screen
            name="budget/payday/got-paid"
            options={{ ...pushedOptions, presentation: "modal" }}
          />
          <Stack.Screen name="budget/payday/wrap-up" options={pushedOptions} />
          <Stack.Screen name="budget/payday/leftovers" options={pushedOptions} />
          <Stack.Screen name="budget/payday/plan" options={pushedOptions} />
        </Stack.Protected>
        <Stack.Screen name="callback" options={{ headerShown: false }} />
      </Stack>
    </LedgerDataProvider>
  );
};
