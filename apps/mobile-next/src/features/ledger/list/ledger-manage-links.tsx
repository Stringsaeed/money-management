import { Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";

export interface LedgerNavigation {
  readonly onAddTransaction?: () => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
}

interface LedgerManageLinksProps {
  readonly navigation: LedgerNavigation;
  /** `tiles` are three equal cards; `inline` is a quiet text row. */
  readonly appearance?: "tiles" | "inline";
}

/** Ledger's secondary destinations, kept out of the list's way. */
export function LedgerManageLinks({ navigation, appearance = "tiles" }: LedgerManageLinksProps) {
  const links: readonly { label: string; icon: IconName; onPress?: () => void }[] = [
    { label: "Accounts", icon: "wallet", onPress: navigation.onOpenAccounts },
    { label: "Categories", icon: "list", onPress: navigation.onOpenCategories },
    { label: "Recurring", icon: "arrow-clockwise", onPress: navigation.onOpenRecurring },
  ];
  return (
    <View style={appearance === "tiles" ? styles.tiles : styles.inline}>
      {links.map((link) => (
        <Pressable
          key={link.label}
          accessibilityRole="button"
          accessibilityLabel={`Open ${link.label}`}
          onPress={link.onPress}
          style={({ pressed }) => [
            appearance === "tiles" ? styles.tile : styles.inlineLink,
            pressed && styles.pressed,
          ]}
        >
          <Icon
            name={link.icon}
            size={appearance === "tiles" ? 20 : 16}
            color={colors.foreground}
          />
          <Text style={appearance === "tiles" ? styles.tileLabel : styles.inlineLabel}>
            {link.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: spacing[2] },
  tile: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    flex: 1,
    gap: spacing[2],
    padding: spacing[3],
  },
  tileLabel: {
    color: colors.foreground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  inline: { flexDirection: "row", gap: spacing[4] },
  inlineLink: { alignItems: "center", flexDirection: "row", gap: spacing[1.5] },
  inlineLabel: {
    color: colors.foreground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  pressed: { opacity: 0.6 },
});
