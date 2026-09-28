import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, Text as NativeText } from "react-native";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "@/ui/motion";
import { Text } from "@/ui/text";

interface BalanceSignToggleProps {
  readonly negative: boolean;
  readonly onToggle: () => void;
}

/** Flips an opening balance between money held and money owed (credit cards, loans). */
export function BalanceSignToggle({ negative, onToggle }: BalanceSignToggleProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityLabel={
        negative ? "Opening balance is money owed" : "Opening balance is money held"
      }
      accessibilityHint="Switches between money held and money owed"
      accessibilityRole="button"
      hitSlop={6}
      onPress={onToggle}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <EaseView
          animate={{
            backgroundColor: pressed ? colors.surfaceDim : colors.surfaceContainer,
            scale: pressed ? 0.96 : 1,
          }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={styles.pill}
        >
          <NativeText style={styles.emoji}>{negative ? "🧾" : "💰"}</NativeText>
          <Text style={styles.label}>{negative ? "Money owed" : "Money held"}</Text>
          <Text style={styles.swap}>⇄</Text>
        </EaseView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { alignSelf: "center" },
  pill: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.full,
    flexDirection: "row",
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  emoji: { fontSize: typography.textSm },
  label: {
    color: colors.ink,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  swap: { color: colors.mutedForeground, fontSize: typography.textSm },
});
