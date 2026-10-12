import { StyleSheet, View } from "react-native";

import { TAB_GAP, TAB_HEIGHT } from "./constants";
import { TabBadge } from "./tab-badge";
import type { TabBarTab } from "./types";

export interface TabBadgesProps {
  tabs: readonly TabBarTab[];
  tabWidth: number;
}

const ICON_SIZE = 24;

/** Attention dots, layered above the selector so it never covers them. */
export function TabBadges({ tabs, tabWidth }: TabBadgesProps) {
  // Keeps the dot on the icon's top-right corner at any tab width.
  const right = (tabWidth - ICON_SIZE) / 2 - 3;
  return (
    <View pointerEvents="none" style={styles.row}>
      {tabs.map((tab) => (
        <View key={tab.key} style={[styles.cell, { width: tabWidth }]}>
          {tab.badge ? <TabBadge style={[styles.badge, { right }]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: TAB_GAP, left: 0, position: "absolute", top: 0 },
  cell: { height: TAB_HEIGHT },
  badge: { top: 9 },
});
