import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { SelectChip } from "@/ui/trove";

interface AccountChipsProps {
  readonly accounts: readonly V2Account[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

/** The budget's accounts a big payment can be paid from, opened under the Paid from row. */
export function AccountChips({ accounts, selectedId, onSelect }: AccountChipsProps) {
  return (
    <View accessibilityLabel="Paid from" accessibilityRole="radiogroup" style={styles.chips}>
      {accounts.map((account) => (
        <SelectChip
          key={account.id}
          label={account.name}
          onPress={() => onSelect(account.id)}
          selected={account.id === selectedId}
          size="md"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
