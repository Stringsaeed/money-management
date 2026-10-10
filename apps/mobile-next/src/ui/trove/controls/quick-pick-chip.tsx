import { StyleSheet } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, radius } from "../tokens";

interface QuickPickChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** 36pt pill in Plex Mono; hitSlop 4 reaches the 44pt target. */
export function QuickPickChip({ label, selected, onPress }: QuickPickChipProps) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
    >
      <Text tone={selected ? "accent" : "primary"} variant="amountSm">
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 14,
  },
  idle: { backgroundColor: colors.surface.default, borderColor: colors.border.default },
  selected: { backgroundColor: colors.accent.subtle, borderColor: colors.accent.fill },
});
