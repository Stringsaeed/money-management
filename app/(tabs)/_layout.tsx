import { GlassTabBar } from "@/components/navigation/glass-tab-bar";
import { Tabs } from "expo-router";

export const unstable_settings = {
  anchor: "(home)",
};

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="(home)" options={{ title: "" }} />
      <Tabs.Screen name="ledger" options={{ title: "Ledger" }} />
      <Tabs.Screen name="money-movement" options={{ title: "Money Movement" }} />
      <Tabs.Screen name="envelopes" options={{ title: "Envelopes" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
