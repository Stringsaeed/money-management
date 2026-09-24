import type { ReactNode } from "react";
import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet } from "react-native";

import { colors, radii } from "@/ui/design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "@/ui/motion";

interface NumPadKeyProps {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
}

export function NumPadKey({ accessibilityLabel, children, onPress, onLongPress }: NumPadKeyProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <EaseView
          animate={{
            backgroundColor: pressed ? colors.surfaceContainer : colors.background,
            scale: pressed ? 0.94 : 1,
          }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={styles.key}
        >
          {children}
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  key: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii["2xl"],
    flex: 1,
    justifyContent: "center",
  },
});
