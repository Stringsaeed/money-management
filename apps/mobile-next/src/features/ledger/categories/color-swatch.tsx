import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "@/ui/motion";

interface ColorSwatchProps {
  readonly hex: string;
  readonly name: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}

export function ColorSwatch({ hex, name, selected, onPress }: ColorSwatchProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityLabel={`${name} color`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
    >
      {({ pressed }) => (
        <EaseView
          animate={{ scale: pressed ? 0.9 : 1 }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={[styles.ring, selected && styles.ringSelected]}
        >
          {/* Dynamic category color from data. */}
          <View style={[styles.dot, { backgroundColor: hex }]} />
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    borderRadius: radii.full,
    borderColor: "transparent",
    borderWidth: 2,
    height: spacing[10],
    justifyContent: "center",
    width: spacing[10],
  },
  ringSelected: { borderColor: colors.ink },
  dot: { borderRadius: radii.full, height: spacing[7], width: spacing[7] },
});
