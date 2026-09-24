import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { styles } from "./styles";

interface GlassSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  isInteractive?: boolean;
}

export function GlassSurface({ style, children, isInteractive = true }: GlassSurfaceProps) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={style} isInteractive={isInteractive} glassEffectStyle="regular">
        {children}
      </GlassView>
    );
  }

  return <View style={[style, styles.fallback]}>{children}</View>;
}
