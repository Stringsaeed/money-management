import { EaseView } from "react-native-ease";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

import { motionTransition, STATE_TRANSITION, useReducedMotion } from "@/ui/motion";

import { tileColors, type TileTone } from "../tile-tokens";
import { CheckerMotif } from "./checker-motif";

export interface TilePanelProps {
  children: ReactNode;
  tone?: TileTone;
  motif?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

const toneStyles = {
  cream: { backgroundColor: tileColors.cream },
  olive: { backgroundColor: tileColors.olive },
  pink: { backgroundColor: tileColors.pink },
} satisfies Record<TileTone, ViewStyle>;

export function TilePanel({
  children,
  tone = "cream",
  motif = false,
  style,
  contentStyle,
}: TilePanelProps) {
  const reducedMotion = useReducedMotion();

  return (
    <EaseView
      animate={{ opacity: 1 }}
      initialAnimate={{ opacity: 0 }}
      transition={motionTransition(reducedMotion, STATE_TRANSITION)}
      style={[styles.panel, toneStyles[tone], style]}
    >
      <View pointerEvents="none" style={styles.gloss} />
      {motif ? <CheckerMotif tone={tone} /> : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderColor: tileColors.grout,
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: "0 8px 20px rgba(54, 45, 25, 0.13)",
    overflow: "hidden",
    position: "relative",
  },
  content: {
    gap: 12,
    padding: 20,
  },
  gloss: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    height: 12,
    left: 1,
    position: "absolute",
    right: 1,
    top: 1,
  },
});
