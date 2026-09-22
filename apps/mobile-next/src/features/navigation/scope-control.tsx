import { Pressable, StyleSheet } from "react-native";

import { Icon } from "@/ui/icon";
import { colors, radii, shadows, spacing } from "@/ui/design-tokens";

interface ScopeControlProps {
  readonly label: string;
  readonly onPress: () => void;
}

export function ScopeControl({ label, onPress }: ScopeControlProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ledger scope: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="wallet" size={20} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: shadows.sm,
    flexDirection: "row",
    height: spacing[14],
    justifyContent: "center",
    paddingHorizontal: 0,
    width: spacing[12],
  },
  pressed: { opacity: 0.72 },
});
