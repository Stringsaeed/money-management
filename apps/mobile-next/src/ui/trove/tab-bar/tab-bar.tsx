import { StyleSheet, useWindowDimensions, View } from "react-native";
import { EaseView } from "react-native-ease";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "../../motion";
import { colors, motion, radius, space, troveTransition } from "../tokens";
import {
  BOTTOM_OFFSET,
  PILL_HEIGHT,
  PILL_PADDING,
  SIDE_GAP,
  TAB_GAP,
  TAB_HEIGHT,
} from "./constants";
import { RoundButton } from "./round-button";
import { TabBarSurface } from "./tab-bar-surface";
import { TabButton } from "./tab-button";
import type { TabBarKey, TabBarTab } from "./types";
import { indicatorOffset, tabWidthFor } from "./utils";

export interface TabBarProps {
  tabs: readonly TabBarTab[];
  /** Called for every tab press, including the active one (re-tap scrolls to top). */
  onTabPress: (key: TabBarKey) => void;
  onAccounts: () => void;
  onAdd: () => void;
  /** Long press on Add, e.g. to start a transfer. */
  onAddLongPress?: () => void;
  /** Dot on Accounts: a bank sync needs attention. */
  accountsBadge?: boolean;
  accountsLabel?: string;
  addLabel?: string;
}

/**
 * Floating navigation: an icon-only pill of tabs, a round Accounts button and a round
 * accent Add button, 8pt above the safe-area inset. Business actions come in as props.
 */
export function TabBar({
  tabs,
  onTabPress,
  onAccounts,
  onAdd,
  onAddLongPress,
  accountsBadge = false,
  accountsLabel = "Accounts",
  addLabel = "Add transaction",
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const tabWidth = tabWidthFor(windowWidth, tabs.length);
  const activeIndex = tabs.findIndex((tab) => tab.active);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom + BOTTOM_OFFSET }]}
    >
      <TabBarSurface style={styles.pill}>
        <View accessibilityLabel="Main" accessibilityRole="tablist" style={styles.tabs}>
          {reducedMotion || activeIndex < 0 ? null : (
            <EaseView
              animate={{ translateX: indicatorOffset(activeIndex, tabWidth) }}
              pointerEvents="none"
              style={[styles.indicator, { width: tabWidth }]}
              transition={troveTransition(false, motion.sheet)}
            />
          )}
          {tabs.map((tab) => (
            <TabButton
              fadeFill={reducedMotion}
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              reducedMotion={reducedMotion}
              tab={tab}
              width={tabWidth}
            />
          ))}
        </View>
      </TabBarSurface>
      <RoundButton
        badge={accountsBadge}
        icon="accounts"
        label={accountsLabel}
        onPress={onAccounts}
        variant="surface"
      />
      <RoundButton
        icon="add"
        label={addLabel}
        onLongPress={onAddLongPress}
        onPress={onAdd}
        variant="accent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    gap: SIDE_GAP,
    justifyContent: "center",
    left: 0,
    paddingHorizontal: space[1],
    position: "absolute",
    right: 0,
  },
  pill: { height: PILL_HEIGHT, justifyContent: "center", paddingHorizontal: PILL_PADDING },
  tabs: { flexDirection: "row", gap: TAB_GAP },
  indicator: {
    backgroundColor: colors.tabBar.activeFill,
    borderRadius: radius.full,
    height: TAB_HEIGHT,
    left: 0,
    position: "absolute",
    top: 0,
  },
});
