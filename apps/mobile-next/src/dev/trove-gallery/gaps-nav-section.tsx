import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { colors, Header, layout, showToast, space } from "@/ui/trove";
// New exports are imported from their folders until the trove barrel re-exports them.
import { Avatar } from "@/ui/trove/identity";
import { FilterButton } from "@/ui/trove/navigation";
import { TabBar, type TabBarKey, type TabBarScope, type TabBarTab } from "@/ui/trove/tab-bar";

import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";

const TAB_DEFS = [
  { key: "home", label: "Home" },
  { key: "ledger", label: "Ledger" },
  { key: "market", label: "Market" },
  { key: "settings", label: "Settings" },
] as const satisfies readonly { key: TabBarKey; label: string }[];

/** The bar sits inline in its frame, so it must not add the screen's bottom inset. */
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 } as const;

const announce = (message: string) => () => showToast({ message });

function ScopedTabBar({ initialScope }: { initialScope: TabBarScope }) {
  const [active, setActive] = useState<TabBarKey>("home");
  const [scope, setScope] = useState<TabBarScope>(initialScope);
  const tabs: TabBarTab[] = TAB_DEFS.map((tab) => ({ ...tab, active: tab.key === active }));

  return (
    <View style={styles.frame}>
      <SafeAreaInsetsContext.Provider value={NO_INSETS}>
        <TabBar
          onAdd={announce("Add transaction")}
          onScopePress={() => setScope(scope === "personal" ? "household" : "personal")}
          onTabPress={setActive}
          scope={scope}
          tabs={tabs}
        />
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

function FilterDemo() {
  const [count, setCount] = useState(2);

  return (
    <View style={styles.row}>
      <FilterButton onPress={announce("Filter")} />
      <FilterButton active count={1} onPress={announce("Filter, 1 active")} />
      <FilterButton active count={count} onPress={() => setCount((value) => (value % 4) + 1)} />
    </View>
  );
}

export function GapsNavSection() {
  return (
    <GallerySection stamp="GAPS · NAVIGATION" title="Tab bar v2, headers and filter">
      <GalleryGroup label="TAB BAR · PERSONAL (TAP SCOPE TO SWITCH)">
        <ScopedTabBar initialScope="personal" />
      </GalleryGroup>
      <GalleryGroup label="TAB BAR · HOUSEHOLD">
        <ScopedTabBar initialScope="household" />
      </GalleryGroup>
      <GalleryGroup label="AVATAR · 32 / 44 / 64 · HOUSEHOLD">
        <View style={styles.row}>
          <Avatar initials="AB" size={32} />
          <Avatar initials="AB" />
          <Avatar emoji="🦊" size={64} />
          <Avatar initials="AB" scope="household" />
        </View>
      </GalleryGroup>
      <GalleryGroup label="HEADER · LEADING AVATAR">
        <Header
          actions={[{ icon: "bell", label: "Notifications", onPress: announce("Notifications") }]}
          leading={
            <Avatar accessibilityLabel="Profile" initials="AB" onPress={announce("Profile")} />
          }
          stamp="SAT 10.10.26"
          title="Home"
        />
      </GalleryGroup>
      <GalleryGroup label="HEADER · PRIMARY ACTION">
        <Header
          primaryAction={{ label: "Add", icon: "add", onPress: announce("Add") }}
          title="Accounts"
        />
      </GalleryGroup>
      <GalleryGroup label="HEADER · NEGATIVE + DISABLED ACTIONS">
        <Header
          actions={[
            { icon: "trash", label: "Delete", onPress: announce("Delete"), tone: "negative" },
            { icon: "check", label: "Save", onPress: announce("Save"), disabled: true },
          ]}
          title="Edit entry"
        />
      </GalleryGroup>
      <GalleryGroup label="FILTER BUTTON · OFF / ACTIVE / COUNT (TAP LAST TO CYCLE)">
        <FilterDemo />
      </GalleryGroup>
    </GallerySection>
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
  row: { alignItems: "center", flexDirection: "row", gap: space[4] },
});
