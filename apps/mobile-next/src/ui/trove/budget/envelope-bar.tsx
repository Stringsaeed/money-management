import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { colors, motion, radius, troveTransition } from "../tokens";
import { fillOffset, percent } from "./envelope-progress";

export interface EnvelopeBarProps {
  /** Spent share of the plan, 0…1. */
  progress: number;
  /** Share of the pay period gone, 0…1; null hides the pace tick. */
  pace: number | null;
  /** Fills the bar in negative.text. */
  over: boolean;
}

/**
 * Envelope progress: a 6pt track with a rounded fill that slides (never stretches) to its
 * share, and a 2×12 tick where the pay period stands. Decorative: the row speaks for it.
 */
export function EnvelopeBar({ progress, pace, over }: EnvelopeBarProps) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      pointerEvents="none"
      style={styles.track}
    >
      <View style={styles.clip}>
        {width > 0 ? (
          <EaseView
            animate={{ translateX: fillOffset(over ? 1 : progress, width) }}
            style={[styles.fill, over ? styles.fillOver : styles.fillOk]}
            transition={troveTransition(reducedMotion, motion.slow)}
          />
        ) : null}
      </View>
      {pace === null ? null : <View style={[styles.tick, { left: percent(pace) }]} />}
    </View>
  );
}

const FILL_PARENT = { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 } as const;

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border.subtle,
    borderRadius: radius.full,
    height: 6,
    marginLeft: 46,
  },
  clip: { ...FILL_PARENT, borderRadius: radius.full, overflow: "hidden" },
  fill: { ...FILL_PARENT, borderRadius: radius.full },
  fillOk: { backgroundColor: colors.text.secondary },
  fillOver: { backgroundColor: colors.negative.text },
  tick: {
    backgroundColor: colors.text.primary,
    borderRadius: 1,
    height: 12,
    position: "absolute",
    top: -3,
    width: 2,
  },
});
