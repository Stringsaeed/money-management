import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { colors, motion, radius, troveTransition } from "@/ui/trove";

/**
 * Big payment progress: a 6pt track with an accent fill that slides to the share set aside.
 * Decorative; the row speaks for it. Not `EnvelopeBar`: no pace tick, accent fill, no inset.
 */
export function SavingBar({ fraction }: { readonly fraction: number }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const share = Math.min(Math.max(fraction, 0), 1);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      pointerEvents="none"
      style={styles.track}
    >
      {width > 0 ? (
        <EaseView
          animate={{ translateX: -(1 - share) * width }}
          style={styles.fill}
          transition={troveTransition(reducedMotion, motion.slow)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border.subtle,
    borderRadius: radius.full,
    flex: 1,
    height: 6,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: colors.accent.fill,
    borderRadius: radius.full,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
