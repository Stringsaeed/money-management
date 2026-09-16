import { ArrowClockwiseIcon } from "phosphor-react-native";
import { Pressable, StyleSheet } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface RefreshMarketButtonProps {
  disabled: boolean;
  onPress: () => void;
}

export function RefreshMarketButton({ disabled, onPress }: RefreshMarketButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
        disabled && styles.containerDisabled,
      ]}
    >
      <Icon as={ArrowClockwiseIcon} style={styles.icon} size={14} />
      <Text style={styles.text}>Refresh</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  containerPressed: {
    backgroundColor: colors.surfaceDim,
  },
  containerDisabled: {
    opacity: 0.4,
  },
  icon: {
    color: colors.ink,
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
});
