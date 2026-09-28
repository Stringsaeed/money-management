import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, Text as NativeText } from "react-native";

import { colors, radii, typography } from "@/ui/design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "@/ui/motion";

interface EmojiKeyProps {
  readonly emoji: string;
  readonly selected: boolean;
  /** Hex category color; the selected key takes a 20% tint of it. */
  readonly tint: string;
  readonly onPress: () => void;
}

export function EmojiKey({ emoji, selected, tint, onPress }: EmojiKeyProps) {
  const reducedMotion = useReducedMotion();
  // Dynamic category color from data: 20% alpha tint on the selected key.
  const resting = selected ? `${tint}33` : colors.background;

  return (
    <Pressable
      accessibilityLabel={`Icon ${emoji}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <EaseView
          animate={{
            backgroundColor: pressed ? colors.surfaceContainer : resting,
            scale: pressed ? 0.9 : 1,
          }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={styles.key}
        >
          <NativeText style={styles.emoji}>{emoji}</NativeText>
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { aspectRatio: 1, width: "16.666%" },
  key: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii["2xl"],
    flex: 1,
    justifyContent: "center",
    margin: 2,
  },
  emoji: { fontSize: typography.text2xl, lineHeight: 32 },
});
