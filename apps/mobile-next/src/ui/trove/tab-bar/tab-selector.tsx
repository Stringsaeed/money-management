import { StyleSheet, View } from "react-native";
// oxlint-disable-next-line no-restricted-imports -- Ease animates to declared targets; it cannot track a UI-thread pan frame by frame or keep the clipped icon reveal in lockstep with the selector.
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { Icon } from "../icon";
import { colors, radius } from "../tokens";
import { TAB_GAP, TAB_HEIGHT } from "./constants";
import { TAB_BAR_GLASS } from "./glass";
import type { TabBarTab } from "./types";

export interface TabSelectorProps {
  tabs: readonly TabBarTab[];
  tabWidth: number;
  /** Left edge inside the pill's padded content box. */
  offset: SharedValue<number>;
  opacity: SharedValue<number>;
}

/**
 * The selected-tab fill. It clips a counter-moving row of filled, active-colour icons, so
 * whichever icon sits under it (resting or mid-drag) shows its selected look. On Liquid Glass it
 * is a plain accent.subtle fill inside the glass pill, not glass itself.
 */
export function TabSelector({ tabs, tabWidth, offset, opacity }: TabSelectorProps) {
  const selectorStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: offset.get() }],
  }));
  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset.get() }],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.selector,
        TAB_BAR_GLASS ? styles.glassFill : null,
        { width: tabWidth },
        selectorStyle,
      ]}
    >
      <Animated.View style={[styles.reveal, revealStyle]}>
        {tabs.map((tab) => (
          <View key={tab.key} style={[styles.cell, { width: tabWidth }]}>
            <Icon color={colors.tabBar.activeIcon} filled name={tab.key} />
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: colors.tabBar.activeFill,
    borderRadius: radius.full,
    height: TAB_HEIGHT,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    top: 0,
  },
  glassFill: { backgroundColor: colors.accent.subtle },
  reveal: { flexDirection: "row", gap: TAB_GAP, left: 0, position: "absolute", top: 0 },
  cell: { alignItems: "center", height: TAB_HEIGHT, justifyContent: "center" },
});
