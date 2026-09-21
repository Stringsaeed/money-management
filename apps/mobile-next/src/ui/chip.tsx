import type { ReactNode } from "react";
import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii, spacing, typography } from "./design-tokens";
import { motionTransition, STATE_TRANSITION, useReducedMotion } from "./motion";
import { Text } from "./text";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, onPress, leading, style }: ChipProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
    >
      <EaseView
        animate={{ backgroundColor: selected ? colors.primary : colors.surfaceContainer }}
        pointerEvents="none"
        transition={motionTransition(reducedMotion, STATE_TRANSITION)}
        style={[styles.chip, style]}
      >
        {leading}
        <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      </EaseView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.full,
    flexDirection: "row",
    gap: spacing[1],
    minHeight: spacing[9],
    paddingHorizontal: spacing[3],
  },
  label: {
    color: colors.foreground,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
  },
  selectedLabel: {
    color: colors.primaryForeground,
  },
});
