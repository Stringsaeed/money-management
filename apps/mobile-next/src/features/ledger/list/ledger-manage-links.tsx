import { Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

export interface LedgerNavigation {
  readonly onAddTransaction?: () => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
}

interface LedgerManageLinksProps {
  readonly navigation: LedgerNavigation;
}

/** Ledger's secondary destinations as a quiet row that scrolls away with the entries. */
export function LedgerManageLinks({ navigation }: LedgerManageLinksProps) {
  const links: readonly { label: string; icon: IconName; onPress?: () => void }[] = [
    { label: "Accounts", icon: "wallet", onPress: navigation.onOpenAccounts },
    { label: "Categories", icon: "list", onPress: navigation.onOpenCategories },
    { label: "Recurring", icon: "arrow-clockwise", onPress: navigation.onOpenRecurring },
  ];
  return (
    <View style={styles.row}>
      {links.map((link) => (
        <Pressable
          key={link.label}
          accessibilityRole="button"
          accessibilityLabel={`Open ${link.label}`}
          hitSlop={8}
          onPress={link.onPress}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Icon name={link.icon} size={16} color={colors.foreground} />
          <Text style={styles.label}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[4], paddingTop: spacing[1] },
  link: { alignItems: "center", flexDirection: "row", gap: spacing[1.5] },
  label: {
    color: colors.foreground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  pressed: { opacity: 0.6 },
});
