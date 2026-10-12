import { StyleSheet } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { colors, radius } from "../tokens";
import { TAB_HEIGHT } from "./constants";
import { TAB_BAR_GLASS } from "./glass";
import type { TabBarTab } from "./types";
import { tabHitSlop } from "./utils";

export interface TabButtonProps {
  tab: TabBarTab;
  width: number;
  onPress: () => void;
}

/**
 * One icon-only tab in its idle outline; the selector layered above draws the selected look.
 * On Liquid Glass a press only scales, so no fill covers the glass.
 */
export function TabButton({ tab, width, onPress }: TabButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: tab.active }}
      hitSlop={{ left: tabHitSlop(width), right: tabHitSlop(width) }}
      onPress={onPress}
      pressedStyle={tab.active || TAB_BAR_GLASS ? undefined : styles.pressed}
      style={[styles.tab, { width }]}
    >
      <Icon color={colors.tabBar.idleIcon} name={tab.key} />
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
});
