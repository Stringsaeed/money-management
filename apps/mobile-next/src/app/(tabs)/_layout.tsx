import { Tabs } from "expo-router";
import { useBudgetingEnabled } from "@/features/feature-flags";
import { AppTabBar } from "@/navigation/app-tab-bar";
import { colors } from "@/ui/trove";

export default function TabLayout() {
  const budgeting = useBudgetingEnabled();
  return (
    <Tabs
      initialRouteName="(home)"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg.canvas } }}
    >
      <Tabs.Screen name="(home)" options={{ title: "Home" }} />
      <Tabs.Protected guard={budgeting}>
        <Tabs.Screen name="envelopes" options={{ title: "Budget" }} />
      </Tabs.Protected>
      <Tabs.Screen name="ledger" options={{ title: "Ledger" }} />
      <Tabs.Screen name="market" options={{ title: "Market" }} />
    </Tabs>
  );
}
