import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius } from "../tokens";

interface RadioDotProps {
  selected: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 22pt radio mark: a 7pt accent ring around an 8pt hole when selected, 1.5pt strong ring idle. */
export function RadioDot({ selected, style }: RadioDotProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.dot, selected ? styles.on : styles.off, style]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderRadius: radius.full, flexShrink: 0, height: 22, width: 22 },
  on: { borderColor: colors.accent.fill, borderWidth: 7 },
  off: { borderColor: colors.border.strong, borderWidth: 1.5 },
});
