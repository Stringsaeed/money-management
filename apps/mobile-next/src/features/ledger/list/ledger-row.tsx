import { StyleSheet, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { space, TransactionRow } from "@/ui/trove";

import type { LedgerRowDisplay } from "./ledger-row-display";

interface LedgerRowProps {
  readonly transaction: V2Transaction;
  readonly display: LedgerRowDisplay;
  readonly onPress?: (transaction: V2Transaction) => void;
}

/** Ledger Transaction row: neutral Category tile, title over meta, signed amount. */
export function LedgerRow({ transaction, display, onPress }: LedgerRowProps) {
  return (
    <View style={styles.row}>
      <TransactionRow
        title={display.title}
        subtitle={display.meta || undefined}
        minor={display.signedMinor}
        currency={display.currency}
        icon={display.tile}
        signDisplay={display.signDisplay}
        onPress={() => onPress?.(transaction)}
      />
    </View>
  );
}

// TransactionRow insets its content by the card padding; this tops it up to the screen gutter.
const styles = StyleSheet.create({
  row: { paddingHorizontal: space[1] },
});
