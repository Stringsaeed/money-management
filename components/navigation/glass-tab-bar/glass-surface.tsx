import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { StyleSheet, useColorScheme, View, type StyleProp, type ViewStyle } from "react-native";

import { styles } from "./styles";

interface GlassSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  isInteractive?: boolean;
}

export function GlassSurface({ style, children, isInteractive = true }: GlassSurfaceProps) {
  const scheme = useColorScheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={style} isInteractive={isInteractive} glassEffectStyle="regular">
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={60}
      tint={scheme === "dark" ? "dark" : "light"}
      style={[style, styles.fallback]}
    >
      <View
        style={StyleSheet.absoluteFill}
        className="bg-foreground/5 border border-foreground/10"
      />
      {children}
    </BlurView>
  );
}
