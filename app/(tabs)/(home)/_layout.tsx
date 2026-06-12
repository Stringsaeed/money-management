import { Stack } from "expo-router";

import { FiltersButton } from "@/components/home/filters-button";
import { useTabStackScreenOptions } from "@/components/navigation/tab-stack";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={useTabStackScreenOptions()}>
      <Stack.Screen
        name="index"
        options={{
          title: "",
          headerTransparent: true,
          headerRight: () => <FiltersButton />,
        }}
      />
    </Stack>
  );
}
