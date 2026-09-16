import { CaretRightIcon } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

import type { SettingsRowProps } from "./types";

export function SettingsRow({
  emoji,
  label,
  subtitle,
  onPress,
  rightLabel,
  noChevron,
  testID,
}: SettingsRowProps) {
  return (
    <Pressable
      accessibilityLabel={onPress ? label : undefined}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      testID={testID}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
      {!noChevron && <Icon as={CaretRightIcon} style={styles.caret} size={16} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  containerPressed: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: typography.textXl,
    width: 28,
    textAlign: "center",
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
    marginTop: spacing[0.5],
  },
  rightLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.4,
    fontVariant: ["tabular-nums"],
  },
  caret: {
    color: colors.ink,
    opacity: 0.2,
  },
});
