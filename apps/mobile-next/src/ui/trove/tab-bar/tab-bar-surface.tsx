import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius } from "../tokens";

export interface TabBarSurfaceProps {
  children: ReactNode;
  /** Size and layout of the capsule or circle. */
  style?: StyleProp<ViewStyle>;
}

const BLUR_INTENSITY = 50;

/**
 * The bar's material: blurred, translucent tabBar.fill, a hairline ring and a soft shadow.
 * Android has no backdrop blur here, so it falls back to a solid raised surface.
 */
export function TabBarSurface({ children, style }: TabBarSurfaceProps) {
  return (
    <View style={[styles.shell, style]}>
      <View pointerEvents="none" style={styles.clip}>
        <BlurView intensity={BLUR_INTENSITY} style={styles.fill} tint="systemChromeMaterial" />
      </View>
      {children}
      <View pointerEvents="none" style={styles.ring} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.full,
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: colors.tabBar.shadow }],
  },
  clip: { ...StyleSheet.absoluteFill, borderRadius: radius.full, overflow: "hidden" },
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Platform.select({
      android: colors.surface.raised,
      default: colors.tabBar.fill,
    }),
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderColor: colors.tabBar.ring,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
