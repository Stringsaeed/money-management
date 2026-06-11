import { FiltersButton } from "@/components/home/filters-button";
import { GlassTabBar } from "@/components/navigation/glass-tab-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";

export const unstable_settings = {
  anchor: "index",
};
const COLORS = {
  light: { background: "#f5f5f0", foreground: "#2c5f47" },
  dark: { background: "#0f1a14", foreground: "#d6e8dc" },
};

export default function TabsLayout() {
  const colors = useColorScheme() === "dark" ? COLORS.dark : COLORS.light;

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: "Newsreader_500Medium", color: colors.foreground },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "", headerRight: () => <FiltersButton /> }} />
      <Tabs.Screen
        name="ledger"
        options={{ title: "Ledger", headerRight: () => <FiltersButton /> }}
      />
      <Tabs.Screen name="money-movement" options={{ title: "Money Movement" }} />
      <Tabs.Screen name="envelopes" options={{ title: "Envelopes" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
