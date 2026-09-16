import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface EmptyStateProps {
  icon?: string;
  illustration?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  /**
   * Set when the parent doesn't establish a definite height (e.g. an
   * auto-sized card in a ScrollView). `flex-1` needs a bounded ancestor to
   * grow into — without one it resolves to a zero-height flex basis and
   * clips this content, so compact mode hugs its content instead.
   */
  compact?: boolean;
}

export function EmptyState({
  icon,
  illustration,
  title,
  message,
  action,
  compact,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, !compact && styles.flexFill]}
    >
      {illustration ?? (icon ? <Text style={styles.icon}>{icon}</Text> : null)}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[8],
  },
  flexFill: {
    flex: 1,
  },
  icon: {
    fontSize: typography.text5xl,
  },
  title: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textLg,
    textAlign: "center",
    color: colors.foreground,
  },
  message: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    textAlign: "center",
    color: colors.mutedForeground,
    lineHeight: 20,
  },
});
