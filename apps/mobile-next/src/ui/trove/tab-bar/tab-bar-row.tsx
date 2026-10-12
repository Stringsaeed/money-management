import { GlassContainer } from "expo-glass-effect";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { TAB_BAR_GLASS } from "./glass";

export interface TabBarRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The bar's row. On Liquid Glass it is one glass container, so the pill, scope and Add render as
 * a single glass group sharing one material; elsewhere a plain view.
 */
export function TabBarRow({ children, style }: TabBarRowProps) {
  if (TAB_BAR_GLASS) {
    return (
      <GlassContainer pointerEvents="box-none" style={style}>
        {children}
      </GlassContainer>
    );
  }
  return (
    <View pointerEvents="box-none" style={style}>
      {children}
    </View>
  );
}
