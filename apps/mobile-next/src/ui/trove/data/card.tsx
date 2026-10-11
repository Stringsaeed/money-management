import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, elevation, layout, radius, type ElevationLevel } from "../tokens";

export interface CardProps extends ViewProps {
  /** level1 for cards (default); level2/level3 sit on surface.raised. */
  elevation?: ElevationLevel;
}

/** Container on surface tokens: radius.lg, 16pt padding, hairline in dark, soft shadow in light. */
export function Card({ elevation: level = "level1", style, ...props }: CardProps) {
  const lifted = level === "level2" || level === "level3";
  return (
    <View {...props} style={[styles.card, elevation[level], lifted && styles.raised, style]} />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    padding: layout.cardPadding,
  },
  raised: {
    backgroundColor: colors.surface.raised,
  },
});
