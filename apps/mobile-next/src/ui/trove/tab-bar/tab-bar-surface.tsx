import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColorMode } from "../category/use-color-mode";
import { colors, radius } from "../tokens";
import { TAB_BAR_GLASS } from "./glass";
import { GlassSurface } from "./glass-surface";

export interface TabBarSurfaceProps {
  children: ReactNode;
  /** Size and layout of the capsule or circle. */
  style?: StyleProp<ViewStyle>;
  /** Liquid Glass only: raw hex tint, e.g. the Add button. */
  tint?: ColorValue;
}

const BLUR_INTENSITY = 50;

/**
 * The bar's material. iOS 26+ draws interactive Liquid Glass. Elsewhere it is blurred, translucent
 * tabBar.fill with a hairline ring and a soft shadow (0 10 30 in dark, 0 8 24 in paper); Android
 * has no backdrop blur here, so it falls back to a solid raised surface.
 */
export function TabBarSurface({ children, style, tint }: TabBarSurfaceProps) {
  const mode = useColorMode();
  if (TAB_BAR_GLASS) {
    return (
      <GlassSurface style={style} tint={tint}>
        {children}
      </GlassSurface>
    );
  }
  return (
    <View style={[styles.shell, shadowStyles[mode], style]}>
      <View pointerEvents="none" style={styles.clip}>
        <BlurView intensity={BLUR_INTENSITY} style={styles.fill} tint="systemChromeMaterial" />
      </View>
      {children}
      <View pointerEvents="none" style={styles.ring} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: radius.full },
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

const shadowStyles = StyleSheet.create({
  dark: {
    boxShadow: [{ offsetX: 0, offsetY: 10, blurRadius: 30, color: colors.tabBar.shadow }],
  },
  light: {
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: colors.tabBar.shadow }],
  },
});
