import { Stack } from "expo-router";
import type { QueryClient } from "@tanstack/react-query";
import { LedgerDataProvider } from "@/data/ledger-queries";
import { colors, typography } from "@/ui/design-tokens";
import { useLedgerScope } from "./ledger-scope-context";

interface DataNavigatorProps {
  readonly queryClient: QueryClient;
  readonly identityKey: string;
}

/** Editors open as full-height modals from anywhere in the app and draw their own header. */
const editorOptions = { presentation: "modal", headerShown: false } as const;

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: typography.fontBodySemibold },
  contentStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
};

export const DataNavigator = ({ queryClient, identityKey }: DataNavigatorProps) => {
  const { scope } = useLedgerScope();
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
        <Stack.Screen name="accounts/index" options={{ title: "Accounts" }} />
        <Stack.Screen name="accounts/[id]/index" options={{ title: "Account" }} />
        <Stack.Screen name="accounts/new" options={{ title: "New account", ...editorOptions }} />
        <Stack.Screen
          name="accounts/[id]/edit"
          options={{ title: "Edit account", ...editorOptions }}
        />
        <Stack.Screen name="categories/index" options={{ title: "Categories" }} />
        <Stack.Screen name="categories/new" options={{ title: "New category", ...editorOptions }} />
        <Stack.Screen
          name="categories/[id]"
          options={{ title: "Edit category", ...editorOptions }}
        />
        <Stack.Screen
          name="transactions/[id]"
          options={{ title: "Transaction", ...editorOptions }}
        />
        <Stack.Screen name="recurring/index" options={{ title: "Recurring transactions" }} />
        <Stack.Screen
          name="recurring/[id]"
          options={{ title: "Recurring transaction", presentation: "modal" }}
        />
        <Stack.Screen name="household" options={{ title: "Household" }} />
        <Stack.Screen name="callback" options={{ headerShown: false }} />
      </Stack>
    </LedgerDataProvider>
  );
};
