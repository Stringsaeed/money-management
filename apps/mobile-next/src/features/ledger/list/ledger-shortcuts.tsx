import { ScrollView, StyleSheet } from "react-native";

import { layout, space, type IconName } from "@/ui/trove";

import { LedgerShortcutChip } from "./ledger-shortcut-chip";

export interface LedgerNavigation {
  readonly onAddTransaction?: () => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
  readonly onOpenSearch?: () => void;
}

interface LedgerShortcutsProps {
  readonly navigation: LedgerNavigation;
}

/**
 * Accounts, Categories and Recurring as one row of outlined chips under the search pill. On a
 * narrow screen the row scrolls sideways, bleeding past the gutter, rather than wrapping.
 */
export function LedgerShortcuts({ navigation }: LedgerShortcutsProps) {
  const links: readonly { label: string; icon: IconName; onPress?: () => void }[] = [
    { label: "Accounts", icon: "accounts", onPress: navigation.onOpenAccounts },
    { label: "Categories", icon: "category", onPress: navigation.onOpenCategories },
    { label: "Recurring", icon: "recurring", onPress: navigation.onOpenRecurring },
  ];
  return (
    <ScrollView
      accessibilityLabel="Ledger shortcuts"
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {links.map((link) => (
        <LedgerShortcutChip
          key={link.label}
          icon={link.icon}
          label={link.label}
          onPress={link.onPress}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginHorizontal: -layout.screenGutter },
  row: { gap: space[2], paddingHorizontal: layout.screenGutter },
});
