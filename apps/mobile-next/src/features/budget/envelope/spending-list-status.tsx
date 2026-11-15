import { StyleSheet, View } from "react-native";

import type { TransactionPagesResult } from "@/data/transaction-list-queries";
import { Button, space, Text } from "@/ui/trove";

interface SpendingListStatusProps {
  readonly list: TransactionPagesResult;
  readonly hasCategories: boolean;
}

/** In place of the rows: no Category mapped, loading, failed, or nothing spent yet. */
export function SpendingListStatus({ list, hasCategories }: SpendingListStatusProps) {
  if (!hasCategories)
    return (
      <Text style={styles.line} tone="secondary" variant="bodySm">
        No category is mapped to this envelope. Add one under More actions to count spending.
      </Text>
    );
  if (list.isError)
    return (
      <View accessibilityRole="alert" style={styles.error}>
        <Text tone="secondary" variant="bodySm">
          {"Couldn't load this envelope's spending."}
        </Text>
        <Button
          label="Try again"
          onPress={() => void list.refresh()}
          size="sm"
          variant="tertiary"
        />
      </View>
    );
  return (
    <Text style={styles.line} tone="secondary" variant="bodySm">
      {list.isLoading ? "Loading spending…" : "Nothing spent here yet this month."}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { paddingVertical: space[3] },
  error: { alignItems: "flex-start", gap: space[2], paddingVertical: space[3] },
});
