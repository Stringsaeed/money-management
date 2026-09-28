import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

interface TransactionListFooterProps {
  readonly count: number;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly nextPageFailed: boolean;
  readonly onLoadMore: () => void;
}

/** Paging state under a server-paged Transaction list: loading, retry, or end of ledger. */
export function TransactionListFooter({
  count,
  hasNextPage,
  isFetchingNextPage,
  nextPageFailed,
  onLoadMore,
}: TransactionListFooterProps) {
  if (isFetchingNextPage)
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.mutedForeground} accessibilityLabel="Loading more" />
      </View>
    );
  if (nextPageFailed)
    return (
      <View style={styles.footer}>
        <Text style={styles.caption}>Couldn’t load older entries.</Text>
        <Button title="Try again" variant="ghost" onPress={onLoadMore} />
      </View>
    );
  if (!hasNextPage && count > 0)
    return (
      <View style={styles.footer}>
        <Text style={styles.caption}>{count === 1 ? "1 entry" : `${count} entries`} · end</Text>
      </View>
    );
  return null;
}

const styles = StyleSheet.create({
  footer: { alignItems: "center", gap: spacing[2], paddingVertical: spacing[6] },
  caption: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
});
