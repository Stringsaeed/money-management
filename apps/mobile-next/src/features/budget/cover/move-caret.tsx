import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { colors, radius } from "@/ui/trove";

/** The board's 3×40 insertion bar in the glyph's colour, blinking unless motion is reduced. */
export function MoveCaret() {
  const reducedMotion = useReducedMotion();
  return (
    <EaseView
      animate={{ opacity: reducedMotion ? 1 : 0 }}
      initialAnimate={{ opacity: 1 }}
      pointerEvents="none"
      style={styles.caret}
      transition={
        reducedMotion
          ? { type: "none" }
          : { type: "timing", duration: 530, easing: "linear", loop: "reverse" }
      }
    />
  );
}

const styles = StyleSheet.create({
  caret: {
    alignSelf: "center",
    backgroundColor: colors.accent.fill,
    borderRadius: radius.full,
    height: 40,
    width: 3,
  },
});
