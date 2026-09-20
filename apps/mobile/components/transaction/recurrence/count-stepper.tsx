import { Pressable, StyleSheet, View } from "react-native";
import { MinusIcon, PlusIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface CountStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function CountStepper({ value, min = 1, max = 99, onChange }: CountStepperProps) {
  const isMinDisabled = value <= min;
  const isMaxDisabled = value >= max;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Decrease"
        accessibilityRole="button"
        disabled={isMinDisabled}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isMinDisabled && styles.buttonDisabled,
        ]}
      >
        <Icon as={MinusIcon} size={18} style={styles.icon} weight="bold" />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityLabel="Increase"
        accessibilityRole="button"
        disabled={isMaxDisabled}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isMaxDisabled && styles.buttonDisabled,
        ]}
      >
        <Icon as={PlusIcon} size={18} style={styles.icon} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  buttonPressed: {
    backgroundColor: colors.surfaceDim,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  icon: {
    color: colors.ink,
  },
  value: {
    width: 32,
    textAlign: "center",
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
});
