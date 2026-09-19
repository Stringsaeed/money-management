import { Stack } from "expo-router";

import { FiltersButton } from "@/components/home/filters-button";
import { LedgerScopeChrome } from "@/components/navigation/ledger-scope-chrome";
import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerTransparent: true,
          headerLeft: () => <LedgerScopeChrome />,
          headerRight: () => <FiltersButton />,
        }}
      />
    </Stack>
  );
}
