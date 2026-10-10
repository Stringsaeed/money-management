import { Stack } from "expo-router";
import type { QueryClient } from "@tanstack/react-query";
import { LedgerDataProvider } from "@/data/ledger-queries";
import { colors, fonts } from "@/ui/trove";
import { useLedgerScope } from "./ledger-scope-context";

interface DataNavigatorProps {
  readonly queryClient: QueryClient;
  readonly identityKey: string;
}

/** Editors open as full-height modals from anywhere in the app and draw their own header. */
const editorOptions = { presentation: "modal", headerShown: false } as const;

/** Pushed screens draw the Trove compact Header (back, title, actions) themselves. */
const pushedOptions = { headerShown: false } as const;

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg.canvas },
  headerTintColor: colors.text.primary,
  headerTitleStyle: { fontFamily: fonts.bold, color: colors.text.primary },
  contentStyle: { backgroundColor: colors.bg.canvas },
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
          name="transactions/[id]"
          options={{ title: "Transaction", ...editorOptions }}
        />
        <Stack.Screen name="recurring/index" options={pushedOptions} />
        <Stack.Screen name="recurring/[id]" options={{ ...pushedOptions, presentation: "modal" }} />
        <Stack.Screen name="household" options={pushedOptions} />
        <Stack.Screen name="callback" options={{ headerShown: false }} />
      </Stack>
    </LedgerDataProvider>
  );
};
