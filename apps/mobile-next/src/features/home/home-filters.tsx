import { StyleSheet, View } from "react-native";
import type { V2Account } from "@trove/api/v2/contracts";

import { Button, Chip, Sheet, space, Text } from "@/ui/trove";

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
    <Sheet open={open} onDismiss={onDismiss} snapPoints={["full"]} title="Your overview">
      <Text tone="secondary">Choose the period, currency and accounts to include.</Text>
      <Text tone="secondary" variant="labelSm">
        Period
      </Text>
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
      <Text tone="secondary" variant="labelSm">
        Currency
      </Text>
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
      <Text tone="secondary" variant="labelSm">
        Accounts
      </Text>
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
      <Button fullWidth label="Done" onPress={onDismiss} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
