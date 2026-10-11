import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { Amount, Button, ListGroup, ListRow, space, Text } from "@/ui/trove";

interface BalanceCheckProps {
  /** The accounts that hold money you have. */
  readonly accounts: readonly V2Account[];
}

/** "Do these still match?" The Adjust path is the account editor: V2 has no separate adjustment. */
export function BalanceCheck({ accounts }: BalanceCheckProps) {
  if (accounts.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="titleMd">Do these still match?</Text>
      <Text tone="secondary" variant="bodySm">
        Compare with your bank or wallet. If one is off, adjust it before you plan.
      </Text>
      <ListGroup dividerInset={0}>
        {accounts.map((account) => (
          <ListRow
            key={account.id}
            title={account.name}
            trailing={
              <View style={styles.trailing}>
                <Amount currency={BUDGET_CURRENCY} minor={account.balanceMinor} tone="secondary" />
                <Button
                  label="Adjust"
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    router.push({ pathname: "/accounts/[id]/edit", params: { id: account.id } })
                  }
                />
              </View>
            }
          />
        ))}
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
  trailing: { alignItems: "center", flexDirection: "row", gap: space[3] },
});
