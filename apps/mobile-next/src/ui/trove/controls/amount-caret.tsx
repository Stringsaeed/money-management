import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { colors, radius } from "../tokens";

export interface AmountCaretProps {
  /** hero: 40pt bar beside the big amount (default) · field: 18pt bar in a compact amount field. */
  size?: "hero" | "field";
}

/** Blinking insertion bar shown while the amount is focused; static with Reduce Motion. */
export function AmountCaret({ size = "hero" }: AmountCaretProps) {
  const reducedMotion = useReducedMotion();

  return (
    <EaseView
      animate={{ opacity: reducedMotion ? 1 : 0 }}
      initialAnimate={{ opacity: 1 }}
      pointerEvents="none"
      style={[styles.caret, styles[size]]}
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
    marginLeft: 2,
    width: 2,
  },
  hero: { height: 40 },
  field: { height: 18 },
});
