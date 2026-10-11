import { StyleSheet, View } from "react-native";

import { Button, Skeleton, space, Text } from "@/ui/trove";

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
      <View
        accessibilityLabel="Loading more"
        accessibilityState={{ busy: true }}
        style={styles.footer}
      >
        <Skeleton height={space[3]} width={96} />
      </View>
    );
  if (nextPageFailed)
    return (
      <View style={styles.footer}>
        <Text tone="secondary" variant="bodySm">
          Couldn’t load older entries.
        </Text>
        <Button label="Try again" onPress={onLoadMore} size="sm" variant="tertiary" />
      </View>
    );
  if (!hasNextPage && count > 0)
    return (
      <View style={styles.footer}>
        <Text tone="secondary" variant="bodySm">
          {count === 1 ? "1 entry" : `${count} entries`} · end
        </Text>
      </View>
    );
  return null;
}

const styles = StyleSheet.create({
  footer: { alignItems: "center", gap: space[2], paddingVertical: space[6] },
});
