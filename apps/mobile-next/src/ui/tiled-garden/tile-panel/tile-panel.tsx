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
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: "0 2px 8px rgba(54, 45, 25, 0.09)",
    position: "relative",
  },
  content: {
    gap: 12,
    padding: 20,
  },
});
