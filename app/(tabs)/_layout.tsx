import { Tabs } from "expo-router";
import { BubbleTabBar } from "@/components/ui/bubble-tab-bar/bubble-tab-bar";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BubbleTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "Spend" }} />
      <Tabs.Screen name="accounts" options={{ title: "Cards" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
