import { BlurView } from "expo-blur";
import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, useColorScheme, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, rawColorValues, radii, spacing } from "./design-tokens";
import { Icon } from "./icon";
import { motionTransition, STATE_TRANSITION, useReducedMotion } from "./motion";
import { TabBarButton } from "./tab-bar-button";
import type { TabBarItem, TabBarProps } from "./tab-bar-types";

export const DEFAULT_TAB_ITEMS: readonly TabBarItem[] = [
  { key: "home", label: "Home", icon: "house" },
  { key: "ledger", label: "Ledger", icon: "book-open" },
  { key: "market", label: "Market", icon: "chart-line-up" },
  { key: "settings", label: "Settings", icon: "gear" },
];

export function TabBar({
  activeKey,
  items = DEFAULT_TAB_ITEMS,
  onSelect,
  onCreate,
  createAccessibilityLabel = "Create",
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const scheme = useColorScheme();
  const foreground =
    scheme === "dark" ? rawColorValues.dark.foreground : rawColorValues.light.foreground;
  const reservedWidth = onCreate ? spacing[14] + spacing[2] : 0;
  const tabWidth = Math.min(
    68,
    Math.max(
      52,
      Math.floor((screenWidth - spacing[6] - reservedWidth - spacing[2]) / items.length),
    ),
  );
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );
  const indicatorOffset = activeIndex * tabWidth;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: insets.bottom + spacing[2] }]}
    >
      <BlurView intensity={70} tint={scheme === "dark" ? "dark" : "light"} style={styles.pill}>
        <EaseView
          animate={{ translateX: indicatorOffset }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, STATE_TRANSITION)}
          style={[styles.indicator, { backgroundColor: `${foreground}1A`, width: tabWidth }]}
        />
        {items.map((item) => (
          <TabBarButton
            item={item}
            key={item.key}
            onPress={() => onSelect(item.key)}
            selected={item.key === activeKey}
            width={tabWidth}
          />
        ))}
        <View pointerEvents="none" style={styles.insetBorder} />
      </BlurView>
      {onCreate ? (
        <Pressable
          accessibilityLabel={createAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={4}
          onPress={onCreate}
          style={styles.createPressable}
        >
          <View style={styles.createButton}>
            <Icon name="plus" color={colors.primaryForeground} size={25} weight="bold" />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    left: 0,
    paddingHorizontal: spacing[3],
    position: "absolute",
    right: 0,
  },
  pill: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.full,
    flexDirection: "row",
    overflow: "hidden",
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },
  indicator: {
    borderRadius: radii.full,
    height: 56,
    left: spacing[1],
    position: "absolute",
    top: spacing[1],
  },
  insetBorder: {
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: radii.full,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  createPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    boxShadow: "0px 4px 12px rgba(44, 95, 71, 0.24)",
    height: spacing[14],
    justifyContent: "center",
    width: spacing[14],
  },
});
