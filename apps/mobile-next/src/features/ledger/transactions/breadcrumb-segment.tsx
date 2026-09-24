import { EaseView } from "react-native-ease";
import { Pressable, StyleSheet, Text as NativeText } from "react-native";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { motionTransition, PRESS_TRANSITION, useReducedMotion } from "@/ui/motion";
import { Text } from "@/ui/text";

interface BreadcrumbSegmentProps {
  readonly accessibilityLabel: string;
  readonly emoji: string;
  readonly label: string;
  readonly active?: boolean;
  readonly onPress: () => void;
}

export function BreadcrumbSegment({
  accessibilityLabel,
  emoji,
  label,
  active = true,
  onPress,
}: BreadcrumbSegmentProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
    >
      {({ pressed }) => (
        <EaseView
          animate={{
            backgroundColor: pressed ? colors.surfaceDim : colors.background,
            scale: pressed ? 0.96 : 1,
          }}
          pointerEvents="none"
          transition={motionTransition(reducedMotion, PRESS_TRANSITION)}
          style={styles.segment}
        >
          <NativeText style={styles.emoji}>{emoji}</NativeText>
          <Text numberOfLines={1} style={[styles.label, !active && styles.inactive]}>
            {label}
          </Text>
        </EaseView>
      )}
    </Pressable>
  );
}

export function BreadcrumbSeparator() {
  return <Text style={styles.separator}>›</Text>;
}

const styles = StyleSheet.create({
  segment: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.full,
    flexDirection: "row",
    gap: spacing[1],
    maxWidth: 160,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  emoji: { fontSize: typography.textSm },
  label: {
    color: colors.ink,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  inactive: { opacity: 0.45 },
  separator: {
    color: colors.ink,
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textBase,
    opacity: 0.3,
  },
});
