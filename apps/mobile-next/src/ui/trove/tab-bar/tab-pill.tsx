import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { PILL_HEIGHT, PILL_PADDING, TAB_GAP } from "./constants";
import { TabBadges } from "./tab-badges";
import { TabBarSurface } from "./tab-bar-surface";
import { TabButton } from "./tab-button";
import { TabSelector } from "./tab-selector";
import type { TabBarKey, TabBarTab } from "./types";
import { useTabSelector } from "./use-tab-selector";

export interface TabPillProps {
  tabs: readonly TabBarTab[];
  tabWidth: number;
  reducedMotion: boolean;
  onTabPress: (key: TabBarKey) => void;
}

/** The capsule of icon-only tabs with its draggable selector. */
export function TabPill({ tabs, tabWidth, reducedMotion, onTabPress }: TabPillProps) {
  const { gesture, offset, opacity } = useTabSelector({
    activeIndex: tabs.findIndex((tab) => tab.active),
    tabCount: tabs.length,
    tabWidth,
    reducedMotion,
    onSelect: (index) => {
      const tab = tabs[index];
      if (tab) onTabPress(tab.key);
    },
  });

  return (
    <TabBarSurface style={styles.pill}>
      <GestureDetector gesture={gesture}>
        <View accessibilityLabel="Main" accessibilityRole="tablist" style={styles.tabs}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              tab={tab}
              width={tabWidth}
            />
          ))}
          <TabSelector offset={offset} opacity={opacity} tabWidth={tabWidth} tabs={tabs} />
          {tabs.some((tab) => tab.badge) ? <TabBadges tabWidth={tabWidth} tabs={tabs} /> : null}
        </View>
      </GestureDetector>
    </TabBarSurface>
  );
}

const styles = StyleSheet.create({
  pill: { height: PILL_HEIGHT, justifyContent: "center", paddingHorizontal: PILL_PADDING },
  tabs: { flexDirection: "row", gap: TAB_GAP },
});
