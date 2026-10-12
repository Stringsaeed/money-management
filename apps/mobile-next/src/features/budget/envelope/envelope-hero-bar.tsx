import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { colors, motion, radius, troveTransition } from "@/ui/trove";

interface EnvelopeHeroBarProps {
  /** Spent share, 0…1. */
  readonly progress: number;
  /** Share of the pay period gone, 0…1. */
  readonly pace: number;
  readonly over: boolean;
}

const FILL_PARENT = { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 } as const;

/**
 * The hero's 8pt bar: a fill that slides (never stretches) to the spent share and a 2×16 tick
 * where the pay period stands. Decorative: the hero speaks for it.
 */
export function EnvelopeHeroBar({ progress, pace, over }: EnvelopeHeroBarProps) {
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
            animate={{ translateX: (progress - 1) * width }}
            style={[styles.fill, over ? styles.fillOver : styles.fillOk]}
            transition={troveTransition(reducedMotion, motion.slow)}
          />
        ) : null}
      </View>
      <View style={[styles.tick, { left: `${Math.round(pace * 1000) / 10}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border.subtle,
    borderRadius: radius.full,
    height: 8,
    marginTop: 6,
  },
  clip: { ...FILL_PARENT, borderRadius: radius.full, overflow: "hidden" },
  fill: { ...FILL_PARENT, borderRadius: radius.full },
  fillOk: { backgroundColor: colors.text.secondary },
  fillOver: { backgroundColor: colors.negative.text },
  tick: {
    backgroundColor: colors.text.primary,
    borderRadius: 1,
    height: 16,
    position: "absolute",
    top: -4,
    width: 2,
  },
});
