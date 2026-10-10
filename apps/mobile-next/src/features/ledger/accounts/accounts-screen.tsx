import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAccountsQuery } from "@/data/ledger-queries";
import {
  Amount,
  CategoryTile,
  Chip,
  EmptyState,
  Header,
  layout,
  ListGroup,
  ListRow,
  Screen,
  space,
} from "@/ui/trove";

import { accountTypeOption } from "./account-display";

export interface AccountsScreenProps {
  readonly onOpenAccount?: (id: string) => void;
  readonly onAddAccount?: () => void;
  readonly onBack?: () => void;
}

export function AccountsScreen({ onOpenAccount, onAddAccount, onBack }: AccountsScreenProps) {
  const accounts = useAccountsQuery();
  const [showArchived, setShowArchived] = useState(false);
  const active = accounts.data.filter((account) =>
    showArchived ? account.archived : !account.archived,
  );
  const headerActions = onAddAccount
    ? [{ icon: "add", label: "Add account", onPress: onAddAccount } as const]
    : [];

  if (accounts.isError)
    return (
      <Screen>
        <View style={styles.content}>
          <Header variant="compact" title="Accounts" onBack={onBack} actions={headerActions} />
          <EmptyState
            title="Accounts unavailable"
            message="Check your connection and try again."
            icon="info"
            actionLabel="Try again"
            onAction={() => void accounts.retry()}
          />
        </View>
      </Screen>
    );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Header variant="compact" title="Accounts" onBack={onBack} actions={headerActions} />
        <View style={styles.chips}>
          <Chip
            label="Archived"
            selected={showArchived}
            onPress={() => setShowArchived((value) => !value)}
          />
        </View>
        {active.length > 0 ? (
          <ListGroup>
            {active.map((item) => {
              const option = accountTypeOption(item.type);
              return (
                <ListRow
                  key={item.id}
                  leading={<CategoryTile icon={option.emoji} size="sm" />}
                  title={item.name}
                  subtitle={`${option.label} · ${item.currency}`}
                  trailing={<Amount currency={item.currency} minor={item.balanceMinor} size="md" />}
                  chevron
                  onPress={() => onOpenAccount?.(item.id)}
                  accessibilityLabel={`${item.name}, ${option.label}`}
                />
              );
            })}
          </ListGroup>
        ) : null}
        {active.length === 0 && !accounts.isLoading ? (
          <EmptyState
            title="No accounts"
            message="Create an account to start your ledger."
            icon="accounts"
            actionLabel={onAddAccount ? "Add account" : undefined}
            onAction={onAddAccount}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[4],
    paddingBottom: space[16],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[4],
  },
  chips: { flexDirection: "row", gap: space[2] },
});
