import { GlassView } from "expo-glass-effect";
import type { ReactNode } from "react";
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius } from "../tokens";

export interface GlassSurfaceProps {
  children?: ReactNode;
  /** Size and layout of the capsule or circle. */
  style?: StyleProp<ViewStyle>;
  /** Raw hex tint, e.g. the accent Add button. Glass rejects dynamic colors. */
  tint?: ColorValue;
}

/**
 * iOS Liquid Glass capsule or circle with a 0.5pt tabBar.ring hairline and a soft lift. The glass
 * is interactive and holds its content, so a touch on the content reaches it and it responds.
 */
export function GlassSurface({ children, style, tint }: GlassSurfaceProps) {
  return (
    <View style={styles.lift}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        style={[styles.glass, style]}
        tintColor={tint}
      >
        {children}
        <View pointerEvents="none" style={styles.hairline} />
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  lift: {
    borderRadius: radius.full,
    // boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 16, color: colors.tabBar.glassShadow }],
  },
  glass: { borderRadius: radius.full },
  hairline: {
    ...StyleSheet.absoluteFill,
    borderColor: colors.tabBar.ring,
    borderRadius: radius.full,
    borderWidth: 0.5,
  },
});
