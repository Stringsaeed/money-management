import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, spacing } from "./design-tokens";
import { Button } from "./button";
import { Text } from "./text";

export interface EmptyStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, message, onRetry, icon }: EmptyStateProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" style={styles.message}>
        {message}
      </Text>
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} variant="secondary" style={styles.retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[3],
    justifyContent: "center",
    padding: spacing[6],
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: spacing[12],
    minWidth: spacing[12],
  },
  title: {
    textAlign: "center",
  },
  message: {
    color: colors.mutedForeground,
    maxWidth: 320,
    textAlign: "center",
  },
  retry: {
    marginTop: spacing[2],
  },
});
