import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

interface BalanceCheckProps {
  /** The accounts that hold money you have. */
  readonly accounts: readonly V2Account[];
}

/** "Do these still match?" The Adjust path is the account editor: V2 has no separate adjustment. */
export function BalanceCheck({ accounts }: BalanceCheckProps) {
  if (accounts.length === 0) return null;
  return (
    <Section title="Do these still match?">
      <Text variant="caption">
        Compare with your bank or wallet. If one is off, adjust it before you plan.
      </Text>
      {accounts.map((account) => (
        <View key={account.id} style={styles.row}>
          <View style={styles.copy}>
            <Text variant="body">{account.name}</Text>
            <Text variant="caption">{formatMoneyMinor(account.balanceMinor, BUDGET_CURRENCY)}</Text>
          </View>
          <Button
            title="Adjust"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: "/accounts/[id]/edit", params: { id: account.id } })
            }
          />
        </View>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
    padding: spacing[4],
  },
  copy: { flex: 1, gap: spacing[0.5] },
});
