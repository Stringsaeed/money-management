import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { colors, layout, showToast, TabBar, type TabBarKey, type TabBarTab } from "@/ui/trove";

const TAB_DEFS = [
  { key: "home", label: "Home" },
  { key: "ledger", label: "Ledger" },
  { key: "insights", label: "Insights" },
  { key: "settings", label: "Settings" },
] as const satisfies readonly { key: TabBarKey; label: string }[];

/** The bar sits inline in its frame, so it must not add the screen's bottom inset. */
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 } as const;

export function TabBarDemo() {
  const [active, setActive] = useState<TabBarKey>("home");
  const tabs: TabBarTab[] = TAB_DEFS.map((tab) => ({ ...tab, active: tab.key === active }));

  return (
    <View style={styles.frame}>
      <SafeAreaInsetsContext.Provider value={NO_INSETS}>
        <TabBar
          accountsBadge
          onAccounts={() => showToast({ message: "Accounts" })}
          onAdd={() => showToast({ message: "Add transaction" })}
          onTabPress={setActive}
          tabs={tabs}
        />
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.bg.canvas,
    borderColor: colors.border.default,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    height: 112,
    marginHorizontal: -layout.screenGutter,
  },
});
