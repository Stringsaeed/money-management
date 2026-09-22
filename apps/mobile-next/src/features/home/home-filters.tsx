import { StyleSheet, View } from "react-native";
import type { V2Account } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";
import { spacing } from "@/ui/design-tokens";

interface HomeFiltersProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly accounts: readonly V2Account[];
  readonly currencies: readonly string[];
  readonly currency: string;
  readonly accountId: string | null;
  readonly range: "week" | "month" | "year";
  readonly onCurrency: (currency: string) => void;
  readonly onAccount: (id: string | null) => void;
  readonly onRange: (range: "week" | "month" | "year") => void;
}

export function HomeFilters({
  open,
  onDismiss,
  accounts,
  currencies,
  currency,
  accountId,
  range,
  onCurrency,
  onAccount,
  onRange,
}: HomeFiltersProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      <Text variant="headline">Your overview</Text>
      <Text>Choose the period, currency and accounts to include.</Text>
      <Text variant="label">Period</Text>
      <View style={styles.options}>
        {(["week", "month", "year"] as const).map((value) => (
          <Chip
            key={value}
            label={`This ${value}`}
            selected={range === value}
            onPress={() => onRange(value)}
          />
        ))}
      </View>
      <Text variant="label">Currency</Text>
      <View style={styles.options}>
        {currencies.map((value) => (
          <Chip
            key={value}
            label={value}
            selected={currency === value}
            onPress={() => onCurrency(value)}
          />
        ))}
      </View>
      <Text variant="label">Accounts</Text>
      <View style={styles.options}>
        <Chip label="All accounts" selected={accountId === null} onPress={() => onAccount(null)} />
        {accounts
          .filter((account) => !account.archived && account.currency === currency)
          .map((account) => (
            <Chip
              key={account.id}
              label={account.name}
              selected={accountId === account.id}
              onPress={() => onAccount(account.id)}
            />
          ))}
      </View>
      <Button title="Done" onPress={onDismiss} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginBottom: spacing[3] },
});
