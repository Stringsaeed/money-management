import { StyleSheet, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, radius, space } from "../tokens";
import { ChipRemoveButton } from "./chip-remove-button";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Adds a trailing "x" that calls this instead of `onPress`. */
  onRemove?: () => void;
}

/** 36pt filter chip. Selected: lime-tinted fill, accent border and label. */
export function Chip({ label, selected = false, onPress, onRemove }: ChipProps) {
  const tone = selected ? "accent" : "primary";

  if (onRemove) {
    return (
      <View style={[styles.chip, selected ? styles.selected : styles.idle, styles.removable]}>
        <PressableScale
          accessibilityLabel={label}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          hitSlop={{ top: 4, bottom: 4 }}
          onPress={onPress}
          scaleOnPress={false}
          style={styles.removableLabel}
        >
          <Text tone={tone} variant="labelSm">
            {label}
          </Text>
        </PressableScale>
        <ChipRemoveButton label={label} onPress={onRemove} selected={selected} />
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      style={[styles.chip, styles.label, selected ? styles.selected : styles.idle]}
    >
      <Text tone={tone} variant="labelSm">
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    height: 36,
  },
  label: { justifyContent: "center", paddingHorizontal: space[3] + 2 },
  removable: { alignSelf: "flex-start" },
  removableLabel: {
    height: 34,
    justifyContent: "center",
    paddingLeft: space[3] + 2,
    paddingRight: space[2],
  },
  idle: { backgroundColor: "transparent", borderColor: colors.border.default },
  selected: { backgroundColor: colors.accent.subtle, borderColor: colors.accent.fill },
});
