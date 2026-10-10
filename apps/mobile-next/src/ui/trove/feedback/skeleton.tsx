import { StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { colors, motion, radius } from "../tokens";
import { SHIMMER_LOW_OPACITY, SHIMMER_TRANSITION } from "./utils";

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  /** Defaults to `radius.xs` (4) for text lines; pass `radius.sm` for tiles. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Loading placeholder that shimmers over 1.2 s (0.6 s each way). Static with Reduce Motion.
 * Hidden from assistive tech: label the loading container with `accessibilityState={{ busy: true }}`.
 */
export function Skeleton({
  width = "100%",
  height,
  borderRadius = radius.xs,
  style,
  testID,
}: SkeletonProps) {
  const reducedMotion = useReducedMotion();

  return (
    <EaseView
      accessibilityElementsHidden
      animate={{ opacity: reducedMotion ? 1 : SHIMMER_LOW_OPACITY }}
      importantForAccessibility="no-hide-descendants"
      initialAnimate={{ opacity: 1 }}
      style={[styles.block, { borderRadius, height, width }, style]}
      testID={testID}
      transition={reducedMotion ? motion.fast : SHIMMER_TRANSITION}
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border.subtle },
});
