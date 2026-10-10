import { ListGroup, ListRow, type IconName } from "@/ui/trove";

export interface LedgerNavigation {
  readonly onAddTransaction?: () => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
}

interface LedgerManageLinksProps {
  readonly navigation: LedgerNavigation;
}

/** Ledger's secondary destinations as a quiet group that scrolls away with the entries. */
export function LedgerManageLinks({ navigation }: LedgerManageLinksProps) {
  const links: readonly { label: string; icon: IconName; onPress?: () => void }[] = [
    { label: "Accounts", icon: "accounts", onPress: navigation.onOpenAccounts },
    { label: "Categories", icon: "category", onPress: navigation.onOpenCategories },
    { label: "Recurring", icon: "recurring", onPress: navigation.onOpenRecurring },
  ];
  return (
    <ListGroup>
      {links.map((link) => (
        <ListRow
          key={link.label}
          title={link.label}
          icon={link.icon}
          chevron
          accessibilityLabel={`Open ${link.label}`}
          onPress={link.onPress}
        />
      ))}
    </ListGroup>
  );
}
