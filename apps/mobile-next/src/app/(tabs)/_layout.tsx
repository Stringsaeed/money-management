import { Tabs } from "expo-router";
import { AppTabBar } from "@/navigation/app-tab-bar";
import { colors } from "@/ui/trove";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="(home)"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg.canvas } }}
    >
      <Tabs.Screen name="(home)" options={{ title: "Home" }} />
      <Tabs.Screen name="ledger" options={{ title: "Ledger" }} />
      <Tabs.Screen name="market" options={{ title: "Market" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
