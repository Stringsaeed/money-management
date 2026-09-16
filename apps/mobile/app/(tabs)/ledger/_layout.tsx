import { Stack } from "expo-router";

import { FiltersButton } from "@/components/home/filters-button";
import { LedgerScopeChrome } from "@/components/navigation/ledger-scope-chrome";
import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function LedgerStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen
        name="index"
        options={{
          title: "Ledger",
          headerTransparent: true,
          headerLeft: () => <LedgerScopeChrome />,
          headerRight: () => <FiltersButton />,
        }}
      />
    </Stack>
  );
}
