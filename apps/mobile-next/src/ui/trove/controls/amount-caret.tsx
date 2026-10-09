import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { colors, radius } from "../tokens";

/** Blinking insertion bar shown while the amount is focused; static with Reduce Motion. */
export function AmountCaret() {
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
    marginLeft: 2,
    width: 2,
  },
});
