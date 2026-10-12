import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { SelectChip, space } from "@/ui/trove";

import { accountTypeOption } from "../../ledger/accounts/account-display";

interface PaidWithChipsProps {
  readonly funding: readonly V2Account[];
  readonly cards: readonly V2Account[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Opens the account editor; shown only while the person has no credit-card account. */
  readonly onAddCard: () => void;
}

/** Money accounts and credit cards the spending can come from. */
export function PaidWithChips({
  funding,
  cards,
  selectedId,
  onSelect,
  onAddCard,
}: PaidWithChipsProps) {
  return (
    <View accessibilityLabel="Paid with" accessibilityRole="radiogroup" style={styles.wrap}>
      {[...funding, ...cards].map((account) => (
        <SelectChip
          emoji={accountTypeOption(account.type).emoji}
          key={account.id}
          label={account.name}
          onPress={() => onSelect(account.id)}
          selected={account.id === selectedId}
          size="md"
        />
      ))}
      {cards.length === 0 ? (
        <SelectChip label="Add card" onPress={onAddCard} variant="add" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
