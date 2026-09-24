import { Stack } from "expo-router";
import type { QueryClient } from "@tanstack/react-query";
import { LedgerDataProvider } from "@/data/ledger-queries";
import { colors, typography } from "@/ui/design-tokens";
import { useLedgerScope } from "./ledger-scope-context";

interface DataNavigatorProps {
  readonly queryClient: QueryClient;
  readonly identityKey: string;
}

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
        <Stack.Screen name="accounts/[id]" options={{ title: "Account" }} />
        <Stack.Screen name="categories" options={{ title: "Categories" }} />
        <Stack.Screen
          name="transactions/[id]"
          options={{ title: "Transaction", presentation: "modal", headerShown: false }}
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
