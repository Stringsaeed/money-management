import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { colors, radii, spacing } from "@/lib/design-tokens";

import { useElevatedSurfaceStyle } from "./use-elevated-surface-style";

interface CardProps {
  children: React.ReactNode;
  animated?: boolean;
  clipContent?: boolean;
}

export function Card({ children, animated, clipContent }: CardProps) {
  const Component = animated ? Animated.View : View;
  const elevatedSurfaceStyle = useElevatedSurfaceStyle();

  return (
    <Component
      layout={animated ? layoutTransition : undefined}
      style={[styles.card, elevatedSurfaceStyle]}
    >
      {clipContent ? <View style={styles.clipWrapper}>{children}</View> : children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  clipWrapper: {
    overflow: "hidden",
    borderRadius: radii.lg,
  },
});
