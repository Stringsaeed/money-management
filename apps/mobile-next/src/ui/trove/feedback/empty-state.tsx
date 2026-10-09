import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "../icon";
import { Text } from "../text";
import { colors, radius, space } from "../tokens";
import { ActionButton } from "./action-button";

export interface EmptyStateProps {
  title: string;
  message?: string;
  /** Glyph in the 56pt lime-tinted disc. */
  icon?: IconName;
  /** Primary action ("Create a pot"). Both fields are needed. */
  actionLabel?: string;
  onAction?: () => void;
  /** Wrap in a card (surface.default + hairline). Turn off inside an existing container. */
  framed?: boolean;
}

/** Centered title, one sentence of guidance and a single primary action. */
export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  framed = true,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, framed ? styles.framed : null]}>
      {icon ? (
        <View style={styles.disc}>
          <Icon color={colors.accent.text} name={icon} size={24} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.centered} variant="titleMd">
          {title}
        </Text>
        {message ? (
          <Text style={styles.centered} tone="secondary" variant="bodyMd">
            {message}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} onPress={onAction} size="compact" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: space[4],
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  framed: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  disc: {
    alignItems: "center",
    backgroundColor: colors.accent.subtle,
    borderRadius: radius.full,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  copy: { gap: 6, maxWidth: 280 },
  centered: { textAlign: "center" },
});
