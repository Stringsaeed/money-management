import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, motion, radius, troveTransition } from "../tokens";
import { TAB_HEIGHT } from "./constants";
import { TabBadge } from "./tab-badge";
import type { TabBarTab } from "./types";

export interface TabButtonProps {
  tab: TabBarTab;
  width: number;
  /** Reduce Motion: the selected fill crossfades in place instead of sliding. */
  fadeFill: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}

/** One icon-only tab: outline when idle, filled in tabBar.activeIcon when selected. */
export function TabButton({ tab, width, fadeFill, reducedMotion, onPress }: TabButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: tab.active }}
      onPress={onPress}
      pressedStyle={tab.active ? undefined : styles.pressed}
      style={[styles.tab, { width }]}
    >
      {fadeFill ? (
        <EaseView
          animate={{ opacity: tab.active ? 1 : 0 }}
          pointerEvents="none"
          style={styles.fadeFill}
          transition={troveTransition(reducedMotion, motion.base)}
        />
      ) : null}
      <Icon
        color={tab.active ? colors.tabBar.activeIcon : colors.tabBar.idleIcon}
        filled={tab.active}
        name={tab.key}
      />
      {tab.badge ? <TabBadge style={styles.badge} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: "center",
    borderRadius: radius.full,
    height: TAB_HEIGHT,
    justifyContent: "center",
  },
  pressed: { backgroundColor: colors.fill.neutral },
  fadeFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.tabBar.activeFill,
    borderRadius: radius.full,
  },
  badge: { right: 13, top: 9 },
});
