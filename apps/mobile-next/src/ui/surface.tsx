import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii, shadows, spacing } from "./design-tokens";

export interface SurfaceProps {
  children: ReactNode;
  variant?: "plain" | "recessed" | "raised";
  style?: StyleProp<ViewStyle>;
}

export function Surface({ children, variant = "plain", style }: SurfaceProps) {
  return <View style={[styles.base, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[3],
    padding: spacing[4],
  },
  plain: {
    backgroundColor: colors.card,
  },
  recessed: {
    backgroundColor: colors.surfaceContainer,
  },
  raised: {
    backgroundColor: colors.card,
    boxShadow: shadows.sm,
  },
});
