import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { StyleSheet, useColorScheme, View, type StyleProp, type ViewStyle } from "react-native";

import { styles, darkStyles } from "./styles";

interface GlassSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  isInteractive?: boolean;
}

export function GlassSurface({ style, children, isInteractive = true }: GlassSurfaceProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={style} isInteractive={isInteractive} glassEffectStyle="regular">
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={[style, styles.fallback]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.fallbackOverlay,
          isDark && darkStyles.fallbackOverlay,
        ]}
      />
      {children}
    </BlurView>
  );
}
