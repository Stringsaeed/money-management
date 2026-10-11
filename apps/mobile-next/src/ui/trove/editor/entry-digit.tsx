import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { Text } from "../text";
import { colors, motion } from "../tokens";
import type { EntryCharKind, EntrySize } from "./entry-amount-utils";
import { entryTextStyle } from "./entry-text-style";

interface EntryDigitProps {
  char: string;
  kind: EntryCharKind;
  size: EntrySize;
  /** Nothing typed yet: every character is faded. */
  empty: boolean;
  /** Read once at mount: digits typed after the first render fade in; existing ones never replay. */
  fadeIn: boolean;
}

/**
 * One character of the entry. Ghost cents and the empty "0" stay in text.faded; a freshly typed
 * digit mounts faded and an overlay of the primary glyph fades in over 120 ms (instant under
 * Reduce Motion).
 */
export function EntryDigit({ char, kind, size, empty, fadeIn }: EntryDigitProps) {
  const reducedMotion = useReducedMotion();
  const [animated] = useState(fadeIn);
  const textStyle = entryTextStyle(size);
  const faded = kind === "ghost" || empty;
  const base = (
    <Text
      maxFontSizeMultiplier={1}
      style={[textStyle, { color: faded || animated ? colors.text.faded : colors.text.primary }]}
      variant="amountHero"
    >
      {char}
    </Text>
  );
  if (faded || !animated) return base;
  return (
    <View>
      {base}
      <EaseView
        animate={{ opacity: 1 }}
        initialAnimate={{ opacity: 0 }}
        pointerEvents="none"
        style={styles.overlay}
        transition={reducedMotion ? { type: "none" } : motion.fast}
      >
        <Text maxFontSizeMultiplier={1} style={textStyle} variant="amountHero">
          {char}
        </Text>
      </EaseView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    left: 0,
    position: "absolute",
    top: 0,
  },
});
