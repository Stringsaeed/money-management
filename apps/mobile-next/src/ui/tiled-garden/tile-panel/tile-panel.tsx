import { EaseView } from "react-native-ease";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

import { colors } from "@/ui/design-tokens";
import { motionTransition, STATE_TRANSITION, useReducedMotion } from "@/ui/motion";

export interface TilePanelProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function TilePanel({ children, style, contentStyle }: TilePanelProps) {
  const reducedMotion = useReducedMotion();

  return (
    <EaseView
      animate={{ opacity: 1 }}
      initialAnimate={{ opacity: 0 }}
      transition={motionTransition(reducedMotion, STATE_TRANSITION)}
      style={[styles.panel, style]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: 24,
    // 1px ring (spread, no blur) that follows the light/dark border token, plus a soft drop.
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.border },
      { offsetX: 0, offsetY: 2, blurRadius: 6, color: "rgba(28, 27, 26, 0.06)" },
    ],
    position: "relative",
  },
  content: {
    gap: 12,
    padding: 20,
  },
});
